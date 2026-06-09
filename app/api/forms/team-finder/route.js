import { connectDB } from "@/lib/mongodb";
import ResponseModel from "@/models/Response";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const toPlainMember = (member = {}) => ({
  name: member.name || member.fullName || member.email || "Participant",
  email: member.email || "",
  img: member.img || member.image || member.profilePicture || "",
  ...member,
});

const createCurrentUserMember = (user, email) => {
  const fallbackName = user?.name || email.split("@")[0] || "Participant";

  return {
    name: fallbackName,
    fullName: fallbackName,
    email,
    img: user?.img || "",
    image: user?.img || "",
    profilePicture: user?.img || "",
    branch: user?.branch || "",
    year: user?.year || "",
    rollNo: user?.rollNumber || "",
    rollNumber: user?.rollNumber || "",
  };
};

const ensureCurrentUserMember = (members, user, email) => {
  const currentUserMember = createCurrentUserMember(user, email);
  const currentUserIndex = members.findIndex((member) => member.email?.toLowerCase() === email);

  if (currentUserIndex === -1) return [currentUserMember, ...members];

  return members.map((member, index) => {
    if (index !== currentUserIndex) return member;

    return {
      ...currentUserMember,
      ...member,
      name: member.name || currentUserMember.name,
      fullName: member.fullName || member.name || currentUserMember.fullName,
      email: member.email || email,
      img: member.img || member.image || member.profilePicture || currentUserMember.img,
      image: member.image || member.img || member.profilePicture || currentUserMember.image,
      profilePicture: member.profilePicture || member.img || member.image || currentUserMember.profilePicture,
    };
  });
};

const countFilledMembers = (members = []) =>
  members.filter((member) => Object.values(member || {}).some((value) => String(value || "").trim())).length;

const buildTeamFinderPayload = ({ type, teamRegistration, user, email }) => {
  const submittedMembers = Array.isArray(teamRegistration?.members)
    ? teamRegistration.members.map(toPlainMember).filter((member) => member.name || member.email)
    : [];
  const currentUserMember = createCurrentUserMember(user, email);
  const profile = {
    name: currentUserMember.name,
    email,
    img: currentUserMember.img,
  };

  if (type === "team") {
    const members = ensureCurrentUserMember(submittedMembers, user, email);
    const total = Math.max(members.length, Number(teamRegistration?.maxSize) || members.length || 1);
    const filled = countFilledMembers(members);

    return {
      type: "team",
      profile,
      team: {
        name: teamRegistration?.teamName?.trim() || `${profile.name}'s Team`,
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
    profile: {
      name: submittedMembers[0]?.name || profile.name,
      email: submittedMembers[0]?.email || profile.email,
      img: submittedMembers[0]?.img || submittedMembers[0]?.image || submittedMembers[0]?.profilePicture || profile.img,
    },
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
      needed: Number.isFinite(team.needed) ? team.needed : 0,
      total: Number.isFinite(team.total) ? team.total : Math.max(members.length, 1),
      tags: team.lookingFor?.length ? team.lookingFor : ["Open"],
      members,
      lookingFor: team.lookingFor?.length ? team.lookingFor : ["Teammates"],
      img: teamFinder.profile?.img || members[0]?.img || members[0]?.image || members[0]?.profilePicture || "",
    };
  }

  return {
    id,
    name: teamFinder.profile?.name || response.userEmail.split("@")[0],
    email: teamFinder.profile?.email || response.userEmail,
    img: teamFinder.profile?.img || "",
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
      solo: responses.filter((response) => response.teamFinder?.type === "solo").map(serializeEntry),
      teams: responses.filter((response) => response.teamFinder?.type === "team").map(serializeEntry),
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
      return Response.json({ error: "A valid formId and type are required" }, { status: 400 });
    }

    await connectDB();

    const userEmail = session.user.email.toLowerCase().trim();
    const user = await User.findOne(
      { email: userEmail },
      { name: 1, email: 1, img: 1, branch: 1, year: 1, rollNumber: 1 }
    ).lean();
    const teamFinder = buildTeamFinderPayload({ type, teamRegistration, user, email: userEmail });

    const response = await ResponseModel.findOneAndUpdate(
      { formId, userEmail },
      {
        $set: { teamFinder },
        $setOnInsert: { answers: {}, isSubmitted: false, submittedAt: null },
      },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    return Response.json({ entry: serializeEntry(response), type: teamFinder.type });
  } catch (error) {
    console.error("TEAM FINDER POST ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
