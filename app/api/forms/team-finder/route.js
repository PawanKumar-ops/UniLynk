import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Form from "@/models/Form";
import ResponseModel from "@/models/Response";
import User from "@/models/user";
import { profileAvatar } from "@/lib/avatar";

const norm = (v = "") => String(v || "").trim();
const emailNorm = (v = "") => norm(v).toLowerCase();
const hasText = (v) => norm(v).length > 0;
const memberFilled = (m = {}) => Object.values(m || {}).some(hasText);
const fallbackName = (email = "") => email.split("@")[0] || "Participant";
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

function encodeCursor(item) {
  return Buffer.from(JSON.stringify({ addedAt: item.teamFinder?.addedAt, id: String(item._id) })).toString("base64url");
}

function decodeCursor(value) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    const addedAt = new Date(parsed.addedAt);
    if (!mongoose.isValidObjectId(parsed.id) || Number.isNaN(addedAt.getTime())) return undefined;
    return { addedAt, id: new mongoose.Types.ObjectId(parsed.id) };
  } catch {
    return undefined;
  }
}

const hydrateMembers = async (members = []) => {
  const emails = [...new Set(members.map((m) => emailNorm(m.email)).filter(Boolean))];
  const ids = [...new Set(members.map((m) => norm(m.id)).filter(Boolean))];
  const users = await User.find({
    $or: [emails.length ? { email: { $in: emails } } : null, ids.length ? { _id: { $in: ids } } : null].filter(Boolean),
  }).select("_id name email rollNumber branch year img skills").lean();
  const byEmail = new Map(users.map((u) => [emailNorm(u.email), u]));
  const byId = new Map(users.map((u) => [String(u._id), u]));
  return members.filter(memberFilled).map((m, i) => {
    const u = byEmail.get(emailNorm(m.email)) || byId.get(norm(m.id)) || {};
    return {
      id: String(u._id || m.id || `${m.email || m.name || i}`),
      userId: u._id ? String(u._id) : "",
      name: u.name || m.name || m.fullName || m.email || "Participant",
      email: u.email || m.email || "",
      branch: u.branch || m.branch || "General",
      year: u.year || m.year || "Student",
      avatar: profileAvatar(u.img || m.avatar, u.email || m.email),
      role: i === 0 ? "Team Lead" : m.role || "Member",
      skills: u.skills || [],
    };
  });
};

const buildTeamFinder = async ({ form, response, sessionUser }) => {
  const userEmail = emailNorm(response.userEmail || sessionUser?.email);
  const user = await User.findOne({ email: userEmail }).select("_id name email branch year img skills").lean();
  const max = Math.max(1, Number(form.teamSize) || 4);
  const rawMembers = Array.isArray(response.answers?.team) ? response.answers.team : [];
  const members = await hydrateMembers(rawMembers);
  const leadName = user?.name || sessionUser?.name || fallbackName(userEmail);
  const leadMember = { id: String(user?._id || response._id), userId: user?._id ? String(user._id) : "", name: leadName, email: userEmail, branch: user?.branch || "General", year: user?.year || "Student", avatar: profileAvatar(user?.img, userEmail), role: "Team Lead", skills: user?.skills || [] };
  const fullMembers = [leadMember, ...members.filter((m) => emailNorm(m.email) !== userEmail && m.userId !== leadMember.userId)];
  if (fullMembers.length < max) {
    return { type: "team", profile: { name: leadName, email: userEmail, description: response.teamFinder?.profile?.description || "" }, team: { name: response.teamFinder?.team?.name || `${leadName}'s Team`, lead: leadName, members: fullMembers, needed: max - fullMembers.length, total: max, lookingFor: response.teamFinder?.team?.lookingFor || [] }, addedAt: response.teamFinder?.addedAt || new Date() };
  }
  return null;
};

const serialize = (response, form, user = null) => {
  const tf = response.teamFinder || {};
  const id = String(response._id);
  const userProfile = user || {};
  const profile = tf.profile || {};
  if (tf.type === "team") {
    const team = tf.team || {};
    const description = form?.description || "Open team looking for members";
    return { id, formId: String(response.formId), eventTitle: form?.title || form?.name || "Event", name: team.name || `${team.lead || "Lead"}'s Team`, lead: team.lead || profile.name || "Team Lead", leadEmail: profile.email || response.userEmail, needed: team.needed || 0, total: team.total || Math.max(team.members?.length || 1, 1), category: form?.title || "Event", project: description.length > 88 ? `${description.slice(0, 88).trim()}...` : description, members: team.members || [], lookingFor: team.lookingFor || ["Teammates"] };
  }
  const name = profile.name || userProfile.name || fallbackName(response.userEmail);
  const email = profile.email || userProfile.email || response.userEmail;
  const branch = profile.branch || userProfile.branch || "General";
  const year = profile.year || userProfile.year || "Student";
  const avatar = profileAvatar(profile.avatar || userProfile.img, email);
  const skills = Array.isArray(profile.skills) && profile.skills.length ? profile.skills : Array.isArray(userProfile.skills) ? userProfile.skills : [];
  const descriptionText = profile.description || form?.description || "Looking for a team";
  return {
    id,
    formId: String(response.formId),
    userId: profile.userId || userProfile._id ? String(profile.userId || userProfile._id || "") : "",
    eventTitle: form?.title || form?.name || "Event",
    name,
    email,
    branch,
    year,
    avatar,
    headline: descriptionText.slice(0, 90) + (descriptionText.length > 90 ? "..." : ""),
    looking: profile.description || "I am looking for a team for this event.",
    skills,
  };
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const formId = searchParams.get("formId");
    const itemId = searchParams.get("id");
    const kind = searchParams.get("kind") === "solo" ? "solo" : "team";
    const requestedLimit = Number(searchParams.get("limit") || DEFAULT_PAGE_SIZE);
    if (!Number.isInteger(requestedLimit) || requestedLimit < 1) {
      return Response.json({ error: "limit must be a positive integer" }, { status: 400 });
    }
    const limit = Math.min(requestedLimit, MAX_PAGE_SIZE);
    const cursor = decodeCursor(searchParams.get("cursor"));
    if (cursor === undefined) return Response.json({ error: "Invalid pagination cursor" }, { status: 400 });

    await connectDB();
    const formQuery = { $or: [{ isTeam: true }, { isTeamEvent: true }] };
    if (formId) {
      // An invalid id must return nothing, never every event's teams.
      if (!mongoose.isValidObjectId(formId)) return Response.json({ items: [], nextCursor: null, hasMore: false });
      formQuery._id = formId;
    }
    const forms = await Form.find(formQuery).select("title name description teamSize").lean();
    const byId = new Map(forms.map((f) => [String(f._id), f]));
    if (!forms.length) return Response.json({ items: [], nextCursor: null, hasMore: false });

    const query = {
      formId: { $in: [...byId.keys()] },
      "teamFinder.type": kind,
    };
    if (itemId) {
      if (!mongoose.isValidObjectId(itemId)) return Response.json({ items: [], nextCursor: null, hasMore: false });
      query._id = itemId;
    }
    if (cursor) {
      query.$or = [
        { "teamFinder.addedAt": { $lt: cursor.addedAt } },
        { "teamFinder.addedAt": cursor.addedAt, _id: { $lt: cursor.id } },
      ];
    }
    const responses = await ResponseModel.find(query)
      .select("_id formId userEmail answers.team teamFinder.type teamFinder.profile teamFinder.team teamFinder.addedAt")
      .sort({ "teamFinder.addedAt": -1, _id: -1 })
      .limit(limit + 1)
      .lean();
    const hasMore = responses.length > limit;
    const page = hasMore ? responses.slice(0, limit) : responses;
    const userEmails = [...new Set(page.map((r) => emailNorm(r.userEmail || r.teamFinder?.profile?.email || "")).filter(Boolean))];
    const users = userEmails.length ? await User.find({ email: { $in: userEmails } }).select("_id name email branch year img skills").lean() : [];
    const byUserEmail = new Map(users.map((u) => [emailNorm(u.email), u]));
    const items = page.map((response) => serialize(response, byId.get(String(response.formId)), byUserEmail.get(emailNorm(response.userEmail || response.teamFinder?.profile?.email || ""))));
    return Response.json({
      items,
      nextCursor: hasMore ? encodeCursor(page[page.length - 1]) : null,
      hasMore,
    });
  } catch (e) { console.error(e); return Response.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const { formId, type, teamRegistration, description = "" } = await req.json();
    await connectDB();
    const userEmail = emailNorm(session.user.email);
    const form = await Form.findById(formId).lean();
    if (!form || !(form.isTeam || form.isTeamEvent)) return Response.json({ error: "Team Finder is only available for team events" }, { status: 400 });
    const user = await User.findOne({ email: userEmail }).select("_id name email branch year img skills").lean();
    let teamFinder;
    if (type === "team") teamFinder = { type: "team", profile: { name: user?.name || fallbackName(userEmail), email: userEmail, description }, team: { name: teamRegistration?.teamName?.trim() || `${user?.name || fallbackName(userEmail)}'s Team`, lead: user?.name || fallbackName(userEmail), members: await hydrateMembers(teamRegistration?.members || []), needed: 1, total: Math.max(1, Number(form.teamSize) || 4), lookingFor: [] }, addedAt: new Date() };
    else teamFinder = { type: "solo", profile: { userId: user?._id ? String(user._id) : "", name: user?.name || fallbackName(userEmail), email: userEmail, branch: user?.branch || "General", year: user?.year || "Student", avatar: profileAvatar(user?.img, userEmail), skills: user?.skills || [], description }, addedAt: new Date() };
    const response = await ResponseModel.findOneAndUpdate({ formId, userEmail }, { $set: { teamFinder }, $setOnInsert: { answers: {}, isSubmitted: false, submittedAt: null } }, { upsert: true, new: true, runValidators: true }).lean();
    return Response.json({ entry: serialize(response, form), type: teamFinder.type });
  } catch (e) { console.error(e); return Response.json({ error: e.message }, { status: 500 }); }
}
