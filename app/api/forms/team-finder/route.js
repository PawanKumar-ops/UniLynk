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
  const rawMembers = Array.isArray(response.answers?.teamRegistration?.members) ? response.answers.teamRegistration.members : Array.isArray(response.answers?.team) ? response.answers.team : [];
  const members = await hydrateMembers(rawMembers);
  const leadName = user?.name || sessionUser?.name || fallbackName(userEmail);
  const leadMember = { id: String(user?._id || response._id), userId: user?._id ? String(user._id) : "", name: leadName, email: userEmail, branch: user?.branch || "General", year: user?.year || "Student", avatar: profileAvatar(user?.img, userEmail), role: "Team Lead", skills: user?.skills || [] };
  const fullMembers = [leadMember, ...members.filter((m) => emailNorm(m.email) !== userEmail && m.userId !== leadMember.userId)];
  if (fullMembers.length < max) {
    return { type: "team", profile: { name: leadName, email: userEmail, description: response.teamFinder?.profile?.description || "" }, team: { name: response.teamFinder?.team?.name || `${leadName}'s Team`, lead: leadName, members: fullMembers, needed: max - fullMembers.length, total: max, lookingFor: response.teamFinder?.team?.lookingFor || [] }, addedAt: response.teamFinder?.addedAt || new Date() };
  }
  return null;
};

const buildRegisteredOpenTeam = async ({ form, response, usersByEmail }) => {
  if (!(response.isSubmitted || response.submittedAt)) return null;
  const leadEmail = emailNorm(response.userEmail);
  const leadUser = usersByEmail.get(leadEmail) || null;
  const leadName = leadUser?.name || fallbackName(leadEmail);
  const teamFinderMembers = Array.isArray(response.teamFinder?.team?.members) ? response.teamFinder.team.members : [];
  const submittedMembers = Array.isArray(response.answers?.teamRegistration?.members) ? response.answers.teamRegistration.members.filter(memberFilled) : Array.isArray(response.answers?.team) ? response.answers.team.filter(memberFilled) : [];
  const rawMembers = [
    { id: leadUser?._id ? String(leadUser._id) : String(response._id), userId: leadUser?._id ? String(leadUser._id) : "", name: leadName, email: leadEmail, branch: leadUser?.branch || "General", year: leadUser?.year || "Student", avatar: profileAvatar(leadUser?.img, leadEmail), role: "Team Lead" },
    ...teamFinderMembers,
    ...submittedMembers,
  ];
  const uniqueMembers = rawMembers.filter((member, index, all) =>
    all.findIndex((candidate) => emailNorm(candidate.email) === emailNorm(member.email)) === index
  );
  const total = Math.max(1, Number(form.teamSize) || 4);
  const needed = Math.max(total - uniqueMembers.length, 0);
  if (needed <= 0) return null;
  return {
    id: String(response._id),
    formId: String(response.formId),
    eventTitle: form.title || form.name || "Event",
    name: String(response.answers?.teamRegistration?.teamName || response.answers?.teamName || `${leadName}'s Team`).trim(),
    lead: leadName,
    leadEmail,
    needed,
    total,
    category: form.title || "Event",
    project: form.description || "Open team looking for members",
    members: await hydrateMembers(uniqueMembers),
    lookingFor: ["Teammates"],
  };
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
    await connectDB();
    const query = { "teamFinder.type": { $in: ["solo", "team"] } };
    if (formId) {
      // An invalid id must return nothing, never every event's teams.
      if (!mongoose.isValidObjectId(formId)) return Response.json({ items: [], nextCursor: null, hasMore: false, solo: [], teams: [] });
      query.formId = formId;
    }
    if (itemId && !mongoose.isValidObjectId(itemId)) {
      return Response.json({ items: [], nextCursor: null, hasMore: false, solo: [], teams: [] });
    }
    const session = await auth();
    const viewerEmail = emailNorm(session?.user?.email || "");
    const responses = await ResponseModel.find(query).sort({ "teamFinder.addedAt": -1, submittedAt: -1 }).lean();
    let forms;
    if (formId) {
      forms = await Form.find({ _id: formId, $or: [{ isTeam: true }, { isTeamEvent: true }] }).select("title name description teamSize").lean();
    } else {
      forms = await Form.find({ $or: [{ isTeam: true }, { isTeamEvent: true }] }).select("title name description teamSize").lean();
    }
    const byId = new Map(forms.map((f) => [String(f._id), f]));
    const eventResponseQuery = {
      formId: { $in: [...byId.keys()] },
      isSubmitted: true,
    };
    if (formId) eventResponseQuery.formId = formId;
    if (itemId) eventResponseQuery._id = itemId;
    const eventResponses = await ResponseModel.find(eventResponseQuery)
      .select("_id formId userEmail isSubmitted submittedAt answers.team answers.teamName answers.teamRegistration teamFinder.type teamFinder.profile teamFinder.team teamFinder.addedAt teamFinderRequest.status teamFinderRequest.targetId")
      .sort({ submittedAt: -1, _id: -1 }).lean();
    const userEmails = [...new Set([...responses, ...eventResponses].map((r) => emailNorm(r.userEmail || r.teamFinder?.profile?.email || "")).filter(Boolean))];
    const users = userEmails.length ? await User.find({ email: { $in: userEmails } }).select("_id name email branch year img skills").lean() : [];
    const byUserEmail = new Map(users.map((u) => [emailNorm(u.email), u]));
    const scoped = responses.filter((r) => byId.has(String(r.formId)));
    const acceptedRequesterEmails = new Set(eventResponses
      .filter((response) => response.teamFinderRequest?.status === "accepted")
      .map((response) => `${String(response.formId)}:${emailNorm(response.userEmail)}`));
    const teamResponseByOwner = new Map(scoped.filter((r) => r.teamFinder?.type === "team").map((r) => [`${String(r.formId)}:${emailNorm(r.userEmail)}`, r]));
    const assignedMemberEmails = new Set(scoped.flatMap((response) =>
      [
        ...(response.teamFinder?.type === "team" ? response.teamFinder.team?.members || [] : []),
        ...(Array.isArray(response.answers?.team) ? response.answers.team : []),
        ...(Array.isArray(response.answers?.teamRegistration?.members) ? response.answers.teamRegistration.members : []),
      ]
        .map((member) => `${String(response.formId)}:${emailNorm(member?.email)}`).filter((key) => !key.endsWith(":"))
    ));
    const applicantEmails = [...new Set(eventResponses.map((response) => emailNorm(response.userEmail)).filter(Boolean))];
    const applicantUsers = applicantEmails.length ? await User.find({ email: { $in: applicantEmails } }).select("_id name email branch year img skills").lean() : [];
    const applicantUsersByEmail = new Map(applicantUsers.map((user) => [emailNorm(user.email), user]));
    const eventFormsWithResponses = eventResponses.map((response) => ({ response, form: byId.get(String(response.formId)) }));
    const registeredOpenTeams = await Promise.all(eventFormsWithResponses.map(async ({ response, form }) => {
      const existingTeam = teamResponseByOwner.get(`${String(response.formId)}:${emailNorm(response.userEmail)}`);
      const hasTeamFinderTeam = existingTeam?.teamFinder?.type === "team";
      const hasFormTeam = (Array.isArray(response.answers?.team) && response.answers.team.some(memberFilled)) || (Array.isArray(response.answers?.teamRegistration?.members) && response.answers.teamRegistration.members.some(memberFilled));
      const hasFormTeamName = Boolean(String(response.answers?.teamName || response.answers?.teamRegistration?.teamName || "").trim());
      if (!hasTeamFinderTeam && !hasFormTeam && !hasFormTeamName) return null;
      return buildRegisteredOpenTeam({ form, response: { ...response, teamFinder: existingTeam?.teamFinder || response.teamFinder }, usersByEmail: applicantUsersByEmail });
    }));
    const registeredTeamById = new Map(registeredOpenTeams.filter(Boolean).map((team) => [team.id, team]));
    const acceptedMembersByTeamId = new Map();
    const acceptedTargetByRequester = new Map();
    const acceptedRequesters = eventResponses.filter((response) => response.teamFinderRequest?.status === "accepted");
    const teamOwnerEmailsByForm = new Map();
    for (const response of [...scoped, ...eventResponses]) {
      if (response.teamFinder?.type === "team") {
        const key = String(response.formId);
        const emails = teamOwnerEmailsByForm.get(key) || new Set();
        emails.add(emailNorm(response.userEmail));
        teamOwnerEmailsByForm.set(key, emails);
      }
    }
    for (const accepted of acceptedRequesters) {
      const ownerTeam = teamResponseByOwner.get(`${String(accepted.formId)}:${emailNorm(accepted.userEmail)}`);
      const targetId = accepted.teamFinderRequest?.targetId;
      if (targetId && mongoose.isValidObjectId(targetId)) {
        const targetTeam = scoped.find((candidate) => String(candidate._id) === String(targetId) && candidate.teamFinder?.type === "team");
        if (targetTeam) acceptedTargetByRequester.set(`${String(accepted.formId)}:${emailNorm(accepted.userEmail)}`, targetTeam);
      }
      if (!ownerTeam) {
        if (!targetId && !teamOwnerEmailsByForm.get(String(accepted.formId))?.has(emailNorm(accepted.userEmail))) {
          const registeredTeam = [...registeredTeamById.values()].find((team) => team.formId === String(accepted.formId));
          if (registeredTeam) acceptedTargetByRequester.set(`${String(accepted.formId)}:${emailNorm(accepted.userEmail)}`, { _id: registeredTeam.id, formId: registeredTeam.formId });
        }
        continue;
      }
      const member = await hydrateMembers([{ email: accepted.userEmail }]);
      const bucket = acceptedMembersByTeamId.get(String(ownerTeam._id)) || [];
      if (member.length && !bucket.some((item) => emailNorm(item.email) === emailNorm(accepted.userEmail))) bucket.push(member[0]);
      acceptedMembersByTeamId.set(String(ownerTeam._id), bucket);
    }
    const solo = eventFormsWithResponses
        .filter(({ response }) => !acceptedRequesterEmails.has(`${String(response.formId)}:${emailNorm(response.userEmail)}`))
        .filter(({ response }) => !assignedMemberEmails.has(`${String(response.formId)}:${emailNorm(response.userEmail)}`))
        .filter(({ response }) => !teamResponseByOwner.has(`${String(response.formId)}:${emailNorm(response.userEmail)}`))
        .filter(({ response }) => !(Array.isArray(response.answers?.team) && response.answers.team.some(memberFilled)) && !(Array.isArray(response.answers?.teamRegistration?.members) && response.answers.teamRegistration.members.some(memberFilled)) && !String(response.answers?.teamName || response.answers?.teamRegistration?.teamName || "").trim())
        .map(({ response, form }) => serialize({ ...response, teamFinder: response.teamFinder?.type === "solo" ? response.teamFinder : { type: "solo", profile: { name: applicantUsersByEmail.get(emailNorm(response.userEmail))?.name || fallbackName(response.userEmail), email: response.userEmail } } }, form, applicantUsersByEmail.get(emailNorm(response.userEmail))));
    const teamsById = new Map(registeredTeamById);
    for (const response of scoped.filter((candidate) => candidate.teamFinder?.type === "team")) {
      const serializedTeam = serialize(
        response,
        byId.get(String(response.formId)),
        byUserEmail.get(emailNorm(response.userEmail || response.teamFinder?.profile?.email || "")),
      );
      const members = Array.isArray(serializedTeam.members) ? serializedTeam.members : [];
      const capacity = Math.max(1, Number(serializedTeam.total) || Number(byId.get(String(response.formId))?.teamSize) || members.length || 1);
      // The persisted `needed` value can be stale (especially on older teams).
      // Derive availability from the actual roster so incomplete teams remain visible.
      const needed = Math.max(capacity - members.length, 0);
      if (needed > 0 && members.length < capacity && !teamsById.has(serializedTeam.id)) {
        teamsById.set(serializedTeam.id, { ...serializedTeam, needed, total: capacity });
      } else if (needed > 0 && members.length < capacity && teamsById.has(serializedTeam.id)) {
        teamsById.set(serializedTeam.id, { ...teamsById.get(serializedTeam.id), needed, total: capacity });
      }
    }
    const teams = [...teamsById.values()];
    for (const [requesterKey, targetTeam] of acceptedTargetByRequester) {
      const team = teams.find((candidate) => String(candidate.id) === String(targetTeam._id));
      const requester = eventResponses.find((candidate) => `${String(candidate.formId)}:${emailNorm(candidate.userEmail)}` === requesterKey);
      const requesterEmail = requesterKey.slice(requesterKey.indexOf(":") + 1);
      solo.splice(0, solo.length, ...solo.filter((student) => !(emailNorm(student.email) === requesterEmail && String(student.formId) === String(targetTeam.formId || ""))));
      if (!team || !requester) continue;
      const [member] = await hydrateMembers([{ email: requester.userEmail }]);
      if (member && !team.members.some((existing) => emailNorm(existing.email) === emailNorm(member.email))) team.members.push(member);
      team.needed = Math.max(0, Number(team.total) - team.members.length);
    }
    for (const team of teams) {
      const acceptedMembers = acceptedMembersByTeamId.get(String(team.id)) || [];
      for (const member of acceptedMembers) {
        if (!team.members.some((existing) => emailNorm(existing.email) === emailNorm(member.email))) team.members.push(member);
      }
      team.needed = Math.max(0, Number(team.total) - team.members.length);
    }
    return Response.json({
      viewerEmail,
      items: kind === "solo" ? solo : teams,
      nextCursor: null,
      hasMore: false,
      solo,
      teams,
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
    const submittedRegistration = await ResponseModel.findOne({ formId, userEmail, isSubmitted: true }).select("_id answers").lean();
    if (!submittedRegistration) return Response.json({ error: "Apply to this event before joining TeamFinder" }, { status: 409 });
    let teamFinder;
    if (type === "team") {
      const total = Math.max(1, Number(form.teamSize) || 4);
      const registeredMembers = await hydrateMembers(submittedRegistration.answers?.teamRegistration?.members || submittedRegistration.answers?.team || []);
      const lead = { id: user?._id ? String(user._id) : "", name: user?.name || fallbackName(userEmail), email: userEmail, branch: user?.branch || "", year: user?.year || "", avatar: profileAvatar(user?.img, userEmail), role: "Team Lead" };
      const members = [lead, ...registeredMembers.filter((member) => emailNorm(member.email) !== userEmail)];
      const teamName = teamRegistration?.teamName?.trim() || submittedRegistration.answers?.teamRegistration?.teamName || submittedRegistration.answers?.teamName || `${user?.name || fallbackName(userEmail)}'s Team`;
      if (members.length >= total) return Response.json({ error: "Your registered team is already full" }, { status: 409 });
      teamFinder = { type: "team", profile: { name: user?.name || fallbackName(userEmail), email: userEmail, description }, team: { name: teamName, lead: user?.name || fallbackName(userEmail), members, needed: Math.max(total - members.length, 0), total, lookingFor: [] }, addedAt: new Date() };
    }
    else teamFinder = { type: "solo", profile: { userId: user?._id ? String(user._id) : "", name: user?.name || fallbackName(userEmail), email: userEmail, branch: user?.branch || "General", year: user?.year || "Student", avatar: profileAvatar(user?.img, userEmail), skills: user?.skills || [], description }, addedAt: new Date() };
    const response = await ResponseModel.findOneAndUpdate({ formId, userEmail }, { $set: { teamFinder }, $setOnInsert: { answers: {}, isSubmitted: false, submittedAt: null } }, { upsert: true, new: true, runValidators: true }).lean();
    return Response.json({ entry: serialize(response, form), type: teamFinder.type });
  } catch (e) { console.error(e); return Response.json({ error: e.message }, { status: 500 }); }
}
