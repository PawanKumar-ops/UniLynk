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
  return User.findOne({ email: session.user.email.toLowerCase().trim() });
}

function userIdSet(values = []) {
  return new Set(values.filter(Boolean).map((value) => String(value)));
}

function formatMessage(message, usersById = new Map()) {
  const senderId = String(message.sender?._id || message.sender);
  const sender = usersById.get(senderId) || message.sender;

  return {
    id: String(message._id),
    senderId,
    senderName: sender?.name || sender?.email || "UniLynk User",
    senderImage: sender?.img || "",
    text: message.text || "",
    createdAt: message.createdAt,
  };
}

async function getCommunityAndGroup(communityId, groupId) {
  if (!mongoose.Types.ObjectId.isValid(communityId) || !mongoose.Types.ObjectId.isValid(groupId)) {
    return { error: NextResponse.json({ error: "Valid community and group ids are required" }, { status: 400 }) };
  }

  const community = await Community.findById(communityId);
  if (!community) {
    return { error: NextResponse.json({ error: "Community not found" }, { status: 404 }) };
  }

  const group = community.groups.id(groupId);
  if (!group) {
    return { error: NextResponse.json({ error: "Group not found" }, { status: 404 }) };
  }

  return { community, group };
}

export async function GET(_req, context) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, groupId } = await context.params;
    const { community, group, error } = await getCommunityAndGroup(id, groupId);
    if (error) return error;

    const currentUserId = String(currentUser._id);
    const groupMembers = userIdSet(group.members?.length ? group.members : community.members);
    if (!groupMembers.has(currentUserId)) {
      return NextResponse.json({ error: "You are not a member of this group" }, { status: 403 });
    }

    const senderIds = [...userIdSet((group.messages || []).map((message) => message.sender))];
    const senders = await User.find({ _id: { $in: senderIds } }).select("name email img").lean();
    const usersById = new Map(senders.map((user) => [String(user._id), user]));

    return NextResponse.json({ messages: (group.messages || []).map((message) => formatMessage(message, usersById)) });
  } catch (error) {
    console.error("COMMUNITY MESSAGES GET ERROR:", error);
    return NextResponse.json({ error: "Failed to load group messages" }, { status: 500 });
  }
}

export async function POST(req, context) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, groupId } = await context.params;
    const { community, group, error } = await getCommunityAndGroup(id, groupId);
    if (error) return error;

    const currentUserId = String(currentUser._id);
    const groupMembers = userIdSet(group.members?.length ? group.members : community.members);
    if (!groupMembers.has(currentUserId)) {
      return NextResponse.json({ error: "You are not a member of this group" }, { status: 403 });
    }

    const adminIds = userIdSet(community.admins);
    if (group.isAnnouncement && !adminIds.has(currentUserId)) {
      return NextResponse.json({ error: "Only community admins can post announcements" }, { status: 403 });
    }

    const { text = "" } = await req.json();
    const trimmedText = text.trim();
    if (!trimmedText) {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    }

    group.messages.push({ sender: currentUser._id, text: trimmedText });
    if (group.messages.length > 200) {
      group.messages.splice(0, group.messages.length - 200);
    }
    group.updatedAt = new Date();
    community.updatedAt = new Date();

    await community.save();

    const savedMessage = group.messages[group.messages.length - 1];
    return NextResponse.json({
      ok: true,
      message: formatMessage(savedMessage, new Map([[currentUserId, currentUser]])),
    });
  } catch (error) {
    console.error("COMMUNITY MESSAGES POST ERROR:", error);
    return NextResponse.json({ error: "Failed to send group message" }, { status: 500 });
  }
}
