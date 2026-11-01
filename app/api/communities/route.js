import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getUserIdentities, isClubLeader } from "@/lib/clubLeadership";
import { connectDB } from "@/lib/mongodb";
import Community from "@/models/Community";
import User from "@/models/user";
import { syncClubCommunitiesForUser } from "@/lib/communitySync";

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) return null;
  await connectDB();
  return User.findOne({ email: session.user.email.toLowerCase().trim() });
}

function userFromDoc(user) {
  return {
    id: String(user._id),
    name: user.name || user.email || "UniLynk User",
    image: user.img || "",
    email: user.email || "",
  };
}

function groupFromDoc(group) {
  return {
    id: String(group._id),
    name: group.name,
    description: group.description || "",
    image: group.image || "",
    memberCount: (group.members || []).length,
    isAnnouncement: !!group.isAnnouncement,
    updatedAt: group.updatedAt,
    lastMessage:
      group.messages?.length > 0
        ? group.messages[group.messages.length - 1]?.text || ""
        : "",
  };
}

function communityFromDoc(community, currentUserId, identities = null) {
  const members = (community.members || []).filter((member) => member?._id);
  const admins = (community.admins || []).filter((member) => member?._id);
  const club = community.clubId;

  return {
    id: String(community._id),
    name: community.name,
    description: community.description || "",
    image: community.image || club?.logo || club?.banner || "",
    clubId: club?._id ? String(club._id) : "",
    clubName: club?.clubName || community.name,
    memberCount: members.length,
    isMember: members.some((member) => String(member._id) === String(currentUserId)),
    isAdmin: admins.some((member) => String(member._id) === String(currentUserId)),
    // Only the club's current leadership team may create groups.
    canCreateGroups: Boolean(identities && club && isClubLeader(club, identities)),
    members: members.map(userFromDoc),
    groups: (community.groups || []).map(groupFromDoc),
    updatedAt: community.updatedAt,
  };
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await syncClubCommunitiesForUser(currentUser);
    const identities = await getUserIdentities(currentUser.email);

    const communities = await Community.find({
      members: currentUser._id,
      clubId: { $exists: true, $ne: null },
    })
      .populate("clubId", "clubName description logo banner email leaders members")
      .populate("members", "name img email")
      .populate("admins", "name img email")
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({
      communities: communities.map((community) => communityFromDoc(community, currentUser._id, identities)),
      currentUserId: String(currentUser._id),
    });
  } catch (error) {
    console.error("COMMUNITIES GET ERROR:", error);
    return NextResponse.json({ error: "Failed to load communities" }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json(
    { error: "Communities are created automatically from clubs." },
    { status: 403 }
  );
}
