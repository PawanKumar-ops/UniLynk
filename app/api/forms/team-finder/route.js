import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import ResponseModel from "@/models/Response";
import User from "@/models/user";

const normalizeEmail = (email = "") => String(email || "").toLowerCase().trim();
const pick = (...values) => values.find((value) => String(value || "").trim()) || "";
const filled = (member = {}) => Object.values(member || {}).some((value) => String(value || "").trim());
const fallbackName = (email = "") => email.split("@")[0] || "Participant";

const hydrateUsers = async (responses) => {
  const emails = new Set();
  responses.forEach((response) => {
    if (response.userEmail) emails.add(normalizeEmail(response.userEmail));
    if (response.teamFinder?.profile?.email) emails.add(normalizeEmail(response.teamFinder.profile.email));
    (response.teamFinder?.team?.members || []).forEach((m) => m?.email && emails.add(normalizeEmail(m.email)));
  });
  const users = emails.size
    ? await User.find({ email: { $in: [...emails] } }, { name: 1, email: 1, img: 1, branch: 1, year: 1, skills: 1, teamFinderDescription: 1 }).lean()
    : [];
  return new Map(users.map((u) => [normalizeEmail(u.email), u]));
};

const memberPayload = (member = {}, userMap = new Map()) => {
  const email = normalizeEmail(member.email);
  const user = email ? userMap.get(email) : null;
  return {
    id: user?._id?.toString() || email || member.name,
    userId: user?._id?.toString() || "",
    name: pick(member.name, user?.name, fallbackName(email)),
    email,
    branch: pick(member.branch, user?.branch, "—"),
    year: pick(member.year, user?.year, "—"),
    avatar: pick(member.img, member.image, member.profilePicture, user?.img, "/Profilepic.png"),
    role: member.role || "Member",
    skills: user?.skills || [],
  };
};

const buildDescription = (response, team, profile, user) => pick(
  user?.teamFinderDescription,
  response.answers?.description,
  response.answers?.about,
  team?.lookingFor?.join(", "),
  profile?.headline,
  "Open to team up for this event."
);

const serialize = (response, userMap) => {
  const tf = response.teamFinder || {};
  const profile = tf.profile || {};
  const email = normalizeEmail(profile.email || response.userEmail);
  const user = userMap.get(email);
  const common = { id: response._id.toString(), formId: response.formId?.toString(), submittedBy: response.userEmail };
  if (tf.type === "team") {
    const team = tf.team || {};
    const members = (team.members || []).filter(filled).map((m) => memberPayload(m, userMap));
    const lead = members[0] || memberPayload({ name: profile.name, email }, userMap);
    const total = Number(team.total) || Math.max(members.length, Number(team.maxSize) || 1);
    const needed = Math.max(Number(team.needed ?? total - members.length) || 0, 0);
    const desc = buildDescription(response, team, profile, user);
    return { ...common, type: "team", name: pick(team.name, `${lead.name}'s Team`), project: desc, headline: desc.length > 72 ? `${desc.slice(0, 72).trim()}...` : desc, category: "Event", needed, total, lead: lead.name, leadEmail: lead.email, members, lookingFor: team.lookingFor?.length ? team.lookingFor : ["Teammates"] };
  }
  const desc = buildDescription(response, {}, profile, user);
  return { ...common, type: "solo", userId: user?._id?.toString() || "", name: pick(profile.name, user?.name, fallbackName(email)), email, branch: pick(user?.branch, "—"), year: pick(user?.year, "—"), avatar: pick(user?.img, "/Profilepic.png"), headline: desc.length > 72 ? `${desc.slice(0, 72).trim()}...` : desc, looking: desc, skills: user?.skills || [] };
};

const buildTeamFinderPayload = ({ type, teamRegistration = {}, user, email }) => {
  const members = Array.isArray(teamRegistration.members) ? teamRegistration.members.filter(filled) : [];
  const leadName = pick(members[0]?.name, user?.name, fallbackName(email));
  const leadEmail = normalizeEmail(members[0]?.email || email);
  if (type === "team") {
    const total = Math.max(Number(teamRegistration.maxSize) || 1, members.length || 1);
    return { type: "team", profile: { name: leadName, email: leadEmail }, team: { name: String(teamRegistration.teamName || "").trim() || `${leadName}'s Team`, lead: leadName, members, needed: Math.max(total - members.length, 0), total, lookingFor: [] }, addedAt: new Date() };
  }
  return { type: "solo", profile: { name: pick(user?.name, fallbackName(email)), email }, addedAt: new Date() };
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const formId = searchParams.get("formId");
    await connectDB();
    const query = { "teamFinder.type": { $in: ["solo", "team"] } };
    if (formId) query.formId = formId;
    const responses = await ResponseModel.find(query).sort({ "teamFinder.addedAt": -1 }).lean();
    const userMap = await hydrateUsers(responses);
    const entries = responses.map((r) => serialize(r, userMap));
    return Response.json({ solo: entries.filter((e) => e.type === "solo"), teams: entries.filter((e) => e.type === "team") });
  } catch (error) { console.error("TEAM FINDER GET ERROR:", error); return Response.json({ error: error.message }, { status: 500 }); }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const { formId, type, teamRegistration } = await req.json();
    if (!formId || !["solo", "team"].includes(type)) return Response.json({ error: "A valid formId and type are required" }, { status: 400 });
    await connectDB();
    const email = normalizeEmail(session.user.email);
    const user = await User.findOne({ email }, { name: 1 }).lean();
    const teamFinder = buildTeamFinderPayload({ type, teamRegistration, user, email });
    const response = await ResponseModel.findOneAndUpdate({ formId, userEmail: email }, { $set: { teamFinder }, $setOnInsert: { answers: {}, isSubmitted: false, submittedAt: null } }, { upsert: true, new: true, runValidators: true }).lean();
    const userMap = await hydrateUsers([response]);
    return Response.json({ entry: serialize(response, userMap), type: teamFinder.type });
  } catch (error) { console.error("TEAM FINDER POST ERROR:", error); return Response.json({ error: error.message }, { status: 500 }); }
}
