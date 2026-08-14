import { randomBytes } from "crypto";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import FormResponse from "@/models/Response";
import Form from "@/models/Form";
import User from "@/models/user";
import Club from "@/models/Club";

const REGISTRATION_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function registrationId() {
  const bytes = randomBytes(10);
  return `UL-${[...bytes].map((byte) => REGISTRATION_CHARS[byte % REGISTRATION_CHARS.length]).join("")}`;
}

function cleanAnswers(form, answers) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) throw new Error("Invalid registration data");
  const cleaned = {};
  for (const question of form.questions || []) {
    const value = answers[question.id];
    const empty = value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
    if (question.required && empty) throw new Error(`Please answer: ${question.title || question.question || "required question"}`);
    if (empty) continue;
    if (question.type === "single" || question.type === "dropdown") {
      if (typeof value !== "string" || !(question.options || []).includes(value)) throw new Error("An answer contains an invalid option");
    } else if (question.type === "multiple") {
      if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !(question.options || []).includes(item))) throw new Error("An answer contains an invalid option");
    } else if (typeof value !== "string" && !Array.isArray(value)) {
      throw new Error("Invalid answer format");
    }
    cleaned[question.id] = value;
  }
  return cleaned;
}

async function validateTeam(rawTeam, maxSize) {
  if (!Array.isArray(rawTeam) || rawTeam.length > maxSize) throw new Error(`A team can have at most ${maxSize} members`);
  const ids = rawTeam.map((member) => member?.id).filter(Boolean);
  if (ids.length !== rawTeam.length || new Set(ids.map(String)).size !== ids.length || ids.some((id) => !mongoose.isValidObjectId(id))) {
    throw new Error("Team members must be unique registered users");
  }
  const users = await User.find({ _id: { $in: ids } }).select("_id name rollNumber branch year img").lean();
  if (users.length !== ids.length) throw new Error("One or more team members no longer exist");
  const byId = new Map(users.map((user) => [String(user._id), user]));
  return ids.map((id) => {
    const user = byId.get(String(id));
    return { id: String(user._id), roll: user.rollNumber || String(user._id), name: user.name || "Student", branch: user.branch || "General", year: user.year || "Student", avatar: user.img || "/Profilepic.png" };
  });
}

export async function POST(req) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { formId, answers } = await req.json();
    if (!mongoose.isValidObjectId(formId)) return Response.json({ error: "Invalid event" }, { status: 400 });
    const form = await Form.findById(formId).lean();
    if (!form) return Response.json({ error: "Event not found" }, { status: 404 });
    if (!form.isPublished) return Response.json({ error: "Registration is not open" }, { status: 403 });
    if (form.registrationDeadline && new Date(form.registrationDeadline) <= new Date()) return Response.json({ error: "Registration deadline has passed" }, { status: 410 });

    const userEmail = session.user.email.toLowerCase().trim();
    if (form.visibility === "members") {
      const club = form.clubId ? await Club.findById(form.clubId).select("leaders.email members.email").lean() : null;
      const isMember = club && [...(club.leaders || []), ...(club.members || [])].some((member) => member.email?.toLowerCase() === userEmail);
      if (!isMember) return Response.json({ error: "This event is for club members only" }, { status: 403 });
    }

    const safeAnswers = cleanAnswers(form, answers);
    if (form.isTeam || form.isTeamEvent) safeAnswers.team = await validateTeam(answers?.team || [], Math.max(1, Number(form.teamSize) || 4));

    const existing = await FormResponse.findOne({ formId, userEmail }).select("_id isSubmitted submittedAt").lean();
    if (existing?.isSubmitted || existing?.submittedAt) return Response.json({ error: "Already submitted" }, { status: 409 });

    const user = await User.findOne({ email: userEmail }, { name: 1, rollNumber: 1, branch: 1, year: 1, img: 1, skills: 1 }).lean();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const registration = registrationId();
        const response = existing
          ? await FormResponse.findOneAndUpdate(
              { _id: existing._id, isSubmitted: { $ne: true }, submittedAt: null },
              { $set: { answers: safeAnswers, registrationId: registration, isSubmitted: true, submittedAt: new Date() } },
              { new: true, runValidators: true }
            )
          : await FormResponse.create({ formId, userEmail, answers: safeAnswers, registrationId: registration, isSubmitted: true, submittedAt: new Date() });
        if (!response) return Response.json({ error: "Already submitted" }, { status: 409 });
        if (form.isTeam || form.isTeamEvent) {
          const max = Math.max(1, Number(form.teamSize) || 4);
          const leadName = user?.name || session.user.name || userEmail.split("@")[0];
          const lead = { id: String(user?._id || response._id), userId: String(user?._id || ""), name: leadName, email: userEmail, branch: user?.branch || "General", year: user?.year || "Student", avatar: user?.img || "/Profilepic.png", role: "Team Lead", skills: user?.skills || [] };
          const members = [lead, ...(safeAnswers.team || []).map((m) => ({ ...m, userId: m.id, email: m.email || "", role: m.role || "Member" }))];
          const uniqueMembers = members.filter((m, index, arr) => arr.findIndex((x) => String(x.userId || x.id || x.email) === String(m.userId || m.id || m.email)) === index);
          const hasAddedMembers = (safeAnswers.team || []).length > 0;
          const teamFinder = uniqueMembers.length < max
            ? (hasAddedMembers
              ? { type: "team", profile: { name: leadName, email: userEmail }, team: { name: `${leadName}'s Team`, lead: leadName, members: uniqueMembers, needed: max - uniqueMembers.length, total: max, lookingFor: [] }, addedAt: new Date() }
              : { type: "solo", profile: { userId: String(user?._id || ""), name: leadName, email: userEmail, branch: user?.branch || "General", year: user?.year || "Student", avatar: user?.img || "/Profilepic.png", skills: user?.skills || [], description: "" }, addedAt: new Date() })
            : undefined;
          if (teamFinder) await FormResponse.updateOne({ _id: response._id }, { $set: { teamFinder } });
        }
        return Response.json({ ...response.toObject(), userName: user?.name || session.user.name || "", rollNo: user?.rollNumber || "" }, { status: 201 });
      } catch (error) {
        if (error?.code !== 11000) throw error;
        if (error?.keyPattern?.formId || error?.keyPattern?.userEmail) return Response.json({ error: "Already submitted" }, { status: 409 });
      }
    }
    return Response.json({ error: "Could not reserve a registration ID. Please try again." }, { status: 503 });
  } catch (error) {
    console.error("FORM SUBMIT ERROR:", error);
    return Response.json({ error: error.message || "Unable to submit registration" }, { status: 400 });
  }
}
