import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Community from "@/models/Community";
import User from "@/models/user";

async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  await connectDB();
  return User.findOne({ email: session.user.email.toLowerCase().trim() }).select("_id");
}

function userIdSet(values = []) {
  return new Set(values.filter(Boolean).map((value) => String(value?._id || value)));
}

export async function POST(_req, context) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, groupId, messageId } = await context.params;
    if (![id, groupId, messageId].every((value) => mongoose.Types.ObjectId.isValid(value))) {
      return NextResponse.json({ error: "Valid community, group, and message ids are required" }, { status: 400 });
    }

    const community = await Community.findById(id);
    const group = community?.groups.id(groupId);
    const message = group?.messages.id(messageId);
    if (!community || !group || !message) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    const currentUserId = String(currentUser._id);
    const groupMembers = userIdSet(group.members?.length ? group.members : community.members);
    if (!groupMembers.has(currentUserId)) {
      return NextResponse.json({ error: "You are not a member of this group" }, { status: 403 });
    }

    // Hide this subdocument only for the current member; do not remove it from MongoDB.
    const alreadyDeleted = (message.deletedFor || []).some((userId) => String(userId) === currentUserId);
    if (!alreadyDeleted) message.deletedFor.push(currentUser._id);
    community.updatedAt = new Date();
    await community.save();

    return NextResponse.json({ ok: true, communityId: id, groupId, messageId, mode: "for-me", userId: currentUserId });
  } catch (error) {
    console.error("COMMUNITY DELETE FOR ME ERROR:", error);
    return NextResponse.json({ error: "Failed to delete message for you" }, { status: 500 });
  }
}
