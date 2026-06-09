import { connectDB } from "@/lib/mongodb";
import Form from "@/models/Form";
import FormResponse from "@/models/Response";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const TEAM_REGISTRATION_ANSWER_ID = "teamRegistration";

const normalizeEmail = (email = "") => String(email || "").toLowerCase().trim();

const getMemberName = (member = {}) =>
  member.name || member.fullName || member.email || "Participant";

const hasFilledMemberField = (member = {}) =>
  Object.values(member || {}).some((value) => String(value || "").trim());

const normalizeMember = (member = {}, usersByEmail = new Map()) => {
  const email = normalizeEmail(member.email);
  const user = email ? usersByEmail.get(email) : null;

  return {
    ...member,
    name: getMemberName(member) || user?.name || email || "Participant",
    email: member.email || user?.email || "",
    year: member.year || user?.year || "",
    branch: member.branch || user?.branch || "",
    rollNo: member.rollNo || member.rollNumber || user?.rollNumber || "",
    img: member.img || user?.img || null,
  };
};

const normalizeMembers = (members = [], usersByEmail = new Map()) =>
  (Array.isArray(members) ? members : [])
    .filter(hasFilledMemberField)
    .map((member) => normalizeMember(member, usersByEmail));

const buildRegisteredTeams = (responses, form, usersByEmail) => {
  const minSize = Number(form?.teamConfig?.minSize) || 2;

  return responses
    .filter((response) => response.isSubmitted || response.submittedAt)
    .map((response) => {
      const registration = response.answers?.[TEAM_REGISTRATION_ANSWER_ID];

      if (!registration || registration.mode === "solo") return null;

      const members = normalizeMembers(registration.members, usersByEmail);
      if (!members.length) return null;

      const id = response._id?.toString();
      const lead = members[0];

      return {
        _id: id,
        id,
        name: registration.teamName?.trim() || `${lead.name || response.userEmail.split("@")[0]}'s Team`,
        status: members.length >= minSize ? "complete" : "incomplete",
        members,
        lead: lead.name || response.userEmail,
        createdAt: response.submittedAt || response.createdAt,
        submittedBy: response.userEmail,
      };
    })
    .filter(Boolean);
};

const buildTeamFinderAnalytics = (responses, usersByEmail) => {
  const finderResponses = responses.filter((response) =>
    ["solo", "team"].includes(response.teamFinder?.type)
  );

  const incompleteTeams = finderResponses
    .filter((response) => response.teamFinder?.type === "team")
    .map((response) => {
      const team = response.teamFinder?.team || {};
      const members = normalizeMembers(team.members, usersByEmail);
      const total = Number(team.total) || Math.max(members.length, 1);
      const needed = Number.isFinite(Number(team.needed))
        ? Number(team.needed)
        : Math.max(total - members.length, 0);
      const id = response._id?.toString();

      return {
        _id: id,
        id,
        name: team.name || "Open Team",
        lead: team.lead || response.teamFinder?.profile?.name || members[0]?.name || "Team Lead",
        members,
        lookingForCount: needed,
        needed,
        total,
        lookingFor: team.lookingFor?.length ? team.lookingFor : ["Teammates"],
        createdAt: response.teamFinder?.addedAt || response.updatedAt,
        submittedBy: response.userEmail,
      };
    })
    .filter((team) => team.needed > 0);

  const soloStudents = finderResponses
    .filter((response) => response.teamFinder?.type === "solo")
    .map((response) => {
      const profile = response.teamFinder?.profile || {};
      const email = normalizeEmail(profile.email || response.userEmail);
      const user = email ? usersByEmail.get(email) : null;
      const id = response._id?.toString();

      return {
        _id: id,
        id,
        name: profile.name || user?.name || response.userEmail.split("@")[0],
        email: profile.email || response.userEmail,
        year: user?.year || "",
        branch: user?.branch || "",
        skills: user?.skills || [],
        img: user?.img || null,
        lookingFor: "Team",
        joinedAt: response.teamFinder?.addedAt || response.updatedAt,
      };
    });

  return { incompleteTeams, soloStudents };
};

export async function GET(req, context) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const form = await Form.findById(id);

    if (!form) {
      return Response.json({ error: "Form not found" }, { status: 404 });
    }

    const viewerEmail = session.user.email.toLowerCase();
    const isOwner = form.createdBy && form.createdBy.toLowerCase() === viewerEmail;

    if (!isOwner) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all responses for this form, including Team Finder-only entries.
    const responses = await FormResponse.find({ formId: id }).lean();

    const emails = new Set();
    responses.forEach((response) => {
      if (response.userEmail) emails.add(normalizeEmail(response.userEmail));

      const registrationMembers = response.answers?.[TEAM_REGISTRATION_ANSWER_ID]?.members || [];
      registrationMembers.forEach((member) => {
        if (member?.email) emails.add(normalizeEmail(member.email));
      });

      const finderProfileEmail = response.teamFinder?.profile?.email;
      if (finderProfileEmail) emails.add(normalizeEmail(finderProfileEmail));

      const finderMembers = response.teamFinder?.team?.members || [];
      finderMembers.forEach((member) => {
        if (member?.email) emails.add(normalizeEmail(member.email));
      });
    });

    const users = await User.find(
      { email: { $in: Array.from(emails).filter(Boolean) } },
      { name: 1, email: 1, year: 1, branch: 1, rollNumber: 1, img: 1, skills: 1 }
    ).lean();
    const usersByEmail = new Map(users.map((user) => [normalizeEmail(user.email), user]));

    // Map responses to include user profiles.
    const populatedResponses = responses.map((response) => {
      const user = usersByEmail.get(normalizeEmail(response.userEmail));

      return {
        ...response,
        user: user ? {
          name: user.name,
          year: user.year,
          branch: user.branch,
          img: user.img,
          skills: user.skills || [],
        } : {
          name: response.userEmail.split("@")[0],
          year: "N/A",
          branch: "N/A",
          img: null,
          skills: [],
        }
      };
    });

    return Response.json({
      form,
      responses: populatedResponses,
      teams: buildRegisteredTeams(responses, form, usersByEmail),
      teamFinder: buildTeamFinderAnalytics(responses, usersByEmail),
    });

  } catch (error) {
    console.error("Analytics fetch error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
