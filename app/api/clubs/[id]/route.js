import { connectDB } from "@/lib/mongodb";
import Club from "@/models/Club";
import User from "@/models/user";
import { syncClubCommunity } from "@/lib/communitySync";
import {
  getFallbackNameFromEmail,
  getUniqueClubMemberCount,
  getUserClubProfile,
  normalizeEmail,
} from "@/lib/clubProfileSync";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(_req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    const club = await Club.findById(id).lean();
    if (!club) {
      return Response.json({ message: "Club not found" }, { status: 404 });
    }

    const leaderEmails = Array.isArray(club.leaders)
      ? club.leaders.map((leader) => leader.email).filter(Boolean)
      : [];

    const memberEmails = Array.isArray(club.members)
      ? club.members.map((member) => member.email).filter(Boolean)
      : [];

    const allEmails = [...new Set([...leaderEmails, ...memberEmails].map(normalizeEmail).filter(Boolean))];

    const users = allEmails.length
      ? await User.find({ email: { $in: allEmails } }).select("_id email name img").lean()
      : [];

    const userMap = new Map(users.map((user) => [normalizeEmail(user.email), user]));

    const leaders = (club.leaders || []).map((leader) => {
      const user = userMap.get(normalizeEmail(leader.email));
      const profile = getUserClubProfile(user, leader.email);
      return {
        userId: user?._id?.toString() || null,
        email: leader.email,
        position: leader.position,
        image: user ? profile.profilePicture : (leader.image || profile.profilePicture),
        name: user ? profile.name : leader.email,
      };
    });

    const members = (club.members || []).map((member) => {
      const user = userMap.get(normalizeEmail(member.email));
      const profile = getUserClubProfile(user, member.email);
      return {
        ...member,
        userId: user?._id?.toString() || null,
        name: user ? profile.name : (member.name || profile.name),
        profilePicture: user ? profile.profilePicture : (member.profilePicture || profile.profilePicture),
      };
    });

    return Response.json({
      club: {
        ...club,
        leaders,
        members,
      },
    });
  } catch (error) {
    console.error("FETCH CLUB BY ID ERROR:", error);
    return Response.json({ message: "Failed to fetch club" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;
    const club = await Club.findById(id);

    if (!club) {
      return Response.json({ message: "Club not found" }, { status: 404 });
    }

    const body = await req.json();
    const incomingEmails = Array.isArray(body?.members) ? body.members : [];

    const normalizedEmails = [...new Set(
      incomingEmails
        .map(normalizeEmail)
        .filter((email) => EMAIL_RE.test(email))
    )];

    if (normalizedEmails.length === 0) {
      return Response.json({ message: "No valid member emails provided" }, { status: 400 });
    }

    const users = await User.find({ email: { $in: normalizedEmails } })
      .select("email name img")
      .lean();
    const userMap = new Map(users.map((user) => [normalizeEmail(user.email), user]));

    const existingMembers = Array.isArray(club.members) ? club.members : [];
    const existingEmails = new Set(existingMembers.map((member) => normalizeEmail(member?.email)).filter(Boolean));

    const newMembers = normalizedEmails
      .filter((email) => !existingEmails.has(email))
      .map((email) => {
        const user = userMap.get(email);
        const profile = getUserClubProfile(user, email);
        return {
          email,
          name: profile.name || getFallbackNameFromEmail(email),
          profilePicture: profile.profilePicture,
          position: "Member",
          joiningYear: String(new Date().getFullYear()),
          joinedAt: new Date(),
        };
      });

    if (newMembers.length === 0) {
      return Response.json({
        club: await hydrateClubForResponse(club),
        addedCount: 0,
        message: "All members already exist",
      });
    }

    const updatedMembers = [...existingMembers.map((member) => member.toObject?.() || member), ...newMembers];
    const memberCount = getUniqueClubMemberCount({
      ...club.toObject(),
      members: updatedMembers,
    });

    await Club.updateOne(
      { _id: club._id },
      {
        $set: { memberCount },
        $push: { members: { $each: newMembers } },
      }
    );

    const updatedClub = await Club.findById(club._id);
    await syncClubCommunity(updatedClub);

    return Response.json({
      club: updatedClub,
      addedCount: newMembers.length,
      message: "Members added successfully",
    });
  } catch (error) {
    console.error("ADD CLUB MEMBERS ERROR:", error);
    return Response.json({ message: "Failed to add members" }, { status: 500 });
  }
}
