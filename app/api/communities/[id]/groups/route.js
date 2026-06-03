import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Community from "@/models/Community";
import User from "@/models/user";

function uniqueValidIds(values = []) {
  const seen = new Set();
  return values
    .filter(Boolean)
    .map((value) => String(value))
    .filter((value) => {
      if (!mongoose.Types.ObjectId.isValid(value) || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  await connectDB();
  return User.findOne({ email: session.user.email.toLowerCase().trim() });
}

export async function POST(req, context) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid community id is required" }, { status: 400 });
    }

    const { name = "", description = "", image = "", memberIds = [] } = await req.json();
    const trimmedName = name.trim();

    if (!trimmedName) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    const community = await Community.findById(id);
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const currentUserId = String(currentUser._id);
    const communityMemberIds = uniqueValidIds(community.members);
    const communityAdminIds = uniqueValidIds(community.admins);

    if (!communityMemberIds.includes(currentUserId)) {
      return NextResponse.json({ error: "You are not a member of this community" }, { status: 403 });
    }

    if (!communityAdminIds.includes(currentUserId)) {
      return NextResponse.json({ error: "Only community admins can create groups" }, { status: 403 });
    }

    const requestedMemberIds = uniqueValidIds(memberIds);
    const groupMemberIds = uniqueValidIds([currentUserId, ...requestedMemberIds]).filter((memberId) =>
      communityMemberIds.includes(memberId)
    );

    community.groups.push({
      name: trimmedName,
      description: description.trim(),
      image: image || "",
      members: groupMemberIds,
      createdBy: currentUser._id,
      isAnnouncement: false,
    });

    await community.save();

    const newGroup = community.groups[community.groups.length - 1];

    return NextResponse.json({
      ok: true,
      group: {
        id: String(newGroup._id),
        name: newGroup.name,
        description: newGroup.description || "",
        image: newGroup.image || "",
        memberCount: newGroup.members.length,
        isAnnouncement: false,
        updatedAt: newGroup.updatedAt,
        lastMessage: "",
      },
    });
  } catch (error) {
    console.error("COMMUNITY GROUPS POST ERROR:", error);
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}
