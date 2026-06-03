import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Club from "@/models/Club";
import Community from "@/models/Community";
import User from "@/models/user";

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  await connectDB();
  return User.findOne({ email: session.user.email.toLowerCase().trim() });
}

function uniqueObjectIds(values = []) {
  const seen = new Set();
  return values
    .filter(Boolean)
    .map((value) => String(value))
    .filter((value) => {
      if (!isValidObjectId(value) || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
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

function communityFromDoc(community, currentUserId) {
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
    members: members.map(userFromDoc),
    groups: (community.groups || []).map(groupFromDoc),
    updatedAt: community.updatedAt,
  };
}

async function ensureClubCommunities(currentUser) {
  const userEmail = currentUser.email?.toLowerCase?.().trim();
  if (!userEmail) return;

  const clubs = await Club.find({
    $or: [
      { email: userEmail },
      { "leaders.email": userEmail },
      { "members.email": userEmail },
    ],
  }).lean();

  for (const club of clubs) {
    const memberEmails = new Set(
      [
        club.email,
        ...(club.leaders || []).map((leader) => leader.email),
        ...(club.members || []).map((member) => member.email),
      ]
        .filter(Boolean)
        .map((email) => email.toLowerCase().trim())
    );

    const users = await User.find({ email: { $in: Array.from(memberEmails) } }).select("_id email").lean();
    const memberIds = uniqueObjectIds(users.map((user) => user._id));
    if (!memberIds.length) memberIds.push(String(currentUser._id));

    const adminUsers = users.filter((user) => {
      const email = user.email?.toLowerCase?.().trim();
      return email === club.email?.toLowerCase?.().trim() || (club.leaders || []).some((leader) => leader.email?.toLowerCase?.().trim() === email);
    });
    const adminIds = uniqueObjectIds(adminUsers.map((user) => user._id));
    if (!adminIds.length) adminIds.push(String(currentUser._id));

    const existing = await Community.findOne({ clubId: club._id });
    if (!existing) {
      await Community.create({
        name: `${club.clubName} Community`,
        description: club.description || `Community chat for ${club.clubName}`,
        image: club.logo || club.banner || "",
        clubId: club._id,
        admins: adminIds,
        members: memberIds,
        groups: [
          {
            name: "Announcements",
            description: "Important updates from club admins",
            isAnnouncement: true,
            createdBy: adminIds[0],
            members: memberIds,
          },
          {
            name: "General",
            description: "Chat with everyone in the club",
            createdBy: adminIds[0],
            members: memberIds,
          },
        ],
      });
      continue;
    }

    existing.name = existing.name || `${club.clubName} Community`;
    existing.description = existing.description || club.description || `Community chat for ${club.clubName}`;
    existing.image = existing.image || club.logo || club.banner || "";
    existing.members = uniqueObjectIds([...existing.members, ...memberIds]);
    existing.admins = uniqueObjectIds([...existing.admins, ...adminIds]);

    if (!existing.groups?.length) {
      existing.groups = [
        {
          name: "Announcements",
          description: "Important updates from club admins",
          isAnnouncement: true,
          createdBy: existing.admins[0],
          members: existing.members,
        },
        {
          name: "General",
          description: "Chat with everyone in the club",
          createdBy: existing.admins[0],
          members: existing.members,
        },
      ];
    } else {
      existing.groups.forEach((group) => {
        if (group.isAnnouncement || group.name === "General") {
          group.members = uniqueObjectIds([...group.members, ...memberIds]);
        }
      });
    }

    await existing.save();
  }
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureClubCommunities(currentUser);

    const communities = await Community.find({ members: currentUser._id })
      .populate("clubId", "clubName description logo banner email")
      .populate("members", "name img email")
      .populate("admins", "name img email")
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({
      communities: communities.map((community) => communityFromDoc(community, currentUser._id)),
      currentUserId: String(currentUser._id),
    });
  } catch (error) {
    console.error("COMMUNITIES GET ERROR:", error);
    return NextResponse.json({ error: "Failed to load communities" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name = "", description = "", image = "", memberIds = [] } = await req.json();
    const trimmedName = name.trim();

    if (!trimmedName) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const validMemberIds = uniqueObjectIds(memberIds);
    const existingUsers = await User.find({ _id: { $in: validMemberIds } }).select("_id").lean();
    const allMembers = uniqueObjectIds([currentUser._id, ...existingUsers.map((user) => user._id)]);

    const community = await Community.create({
      name: trimmedName,
      description: description.trim(),
      image: image || "",
      admins: [currentUser._id],
      members: allMembers,
      groups: [
        {
          name: "Announcements",
          description: "Important updates from admins",
          isAnnouncement: true,
          createdBy: currentUser._id,
          members: allMembers,
        },
        {
          name: "General",
          description: "Chat with everyone",
          createdBy: currentUser._id,
          members: allMembers,
        },
      ],
    });

    return NextResponse.json({ ok: true, id: String(community._id) });
  } catch (error) {
    console.error("COMMUNITIES POST ERROR:", error);
    return NextResponse.json({ error: "Failed to create community" }, { status: 500 });
  }
}
