import { connectDB } from "@/lib/mongodb";
import ResponseModel from "@/models/Response";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const toPlainMember = (member = {}) => ({
  name: member.name || member.fullName || member.email || "Participant",
  email: member.email || "",
  ...member,
});

const countFilledMembers = (members = []) =>
  members.filter((member) =>
    Object.values(member || {}).some((value) => String(value || "").trim()),
  ).length;

const buildTeamFinderPayload = ({ type, teamRegistration, user, email }) => {
  const members = Array.isArray(teamRegistration?.members)
    ? teamRegistration.members
        .map(toPlainMember)
        .filter((member) => member.name || member.email)
    : [];
  const fallbackName = user?.name || email.split("@")[0] || "Participant";
  const profile = {
    name: members[0]?.name || fallbackName,
    email: members[0]?.email || email,
  };

  if (type === "team") {
    const total = Math.max(
      members.length,
      Number(teamRegistration?.maxSize) || members.length || 1,
    );
    const filled = countFilledMembers(members);

    return {
      type: "team",
      profile,
      team: {
        name: teamRegistration?.teamName?.trim() || `${fallbackName}'s Team`,
        lead: profile.name,
        members,
        needed: Math.max(total - filled, 0),
        total,
        lookingFor: [],
      },
      addedAt: new Date(),
    };
  }

  return {
    type: "solo",
    profile,
    team: undefined,
    addedAt: new Date(),
  };
};

const serializeEntry = (response) => {
  const teamFinder = response.teamFinder || {};
  const id = response._id.toString();

  if (teamFinder.type === "team") {
    const team = teamFinder.team || {};
    const members = team.members || [];
    return {
      id,
      name: team.name || "Open Team",
      lead: team.lead || teamFinder.profile?.name || "Team Lead",
      leadEmail:
        teamFinder.profile?.email || members[0]?.email || response.userEmail,
      needed: Number.isFinite(team.needed) ? team.needed : 0,
      total: Number.isFinite(team.total)
        ? team.total
        : Math.max(members.length, 1),
      tags: team.lookingFor?.length ? team.lookingFor : ["Open"],
      members,
      lookingFor: team.lookingFor?.length ? team.lookingFor : ["Teammates"],
    };
  }

  return {
    id,
    name: teamFinder.profile?.name || response.userEmail.split("@")[0],
    email: teamFinder.profile?.email || response.userEmail,
  };
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const formId = searchParams.get("formId");

    if (!formId) {
      return Response.json({ error: "formId is required" }, { status: 400 });
    }

    await connectDB();

    const responses = await ResponseModel.find({
      formId,
      "teamFinder.type": { $in: ["solo", "team"] },
    })
      .sort({ "teamFinder.addedAt": -1 })
      .lean();

    return Response.json({
      solo: responses
        .filter((response) => response.teamFinder?.type === "solo")
        .map(serializeEntry),
      teams: responses
        .filter((response) => response.teamFinder?.type === "team")
        .map(serializeEntry),
    });
  } catch (error) {
    console.error("TEAM FINDER GET ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { formId, type, teamRegistration } = await req.json();

    if (!formId || !["solo", "team"].includes(type)) {
      return Response.json(
        { error: "A valid formId and type are required" },
        { status: 400 },
      );
    }

    await connectDB();

    const userEmail = session.user.email.toLowerCase().trim();
    const user = await User.findOne({ email: userEmail }, { name: 1 }).lean();
    const teamFinder = buildTeamFinderPayload({
      type,
      teamRegistration,
      user,
      email: userEmail,
    });

    const response = await ResponseModel.findOneAndUpdate(
      { formId, userEmail },
      {
        $set: { teamFinder },
        $setOnInsert: { answers: {}, isSubmitted: false, submittedAt: null },
      },
      { upsert: true, new: true, runValidators: true },
    ).lean();

    return Response.json({
      entry: serializeEntry(response),
      type: teamFinder.type,
    });
  } catch (error) {
    console.error("TEAM FINDER POST ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
