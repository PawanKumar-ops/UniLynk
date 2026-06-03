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

function formatReactions(reactions = []) {
  return (reactions || []).map((reaction) => ({
    userId: String(reaction.userId?._id || reaction.userId),
    emoji: reaction.emoji,
  }));
}

function formatSeenBy(seenBy = []) {
  return (seenBy || []).map((seen) => ({
    userId: String(seen.userId?._id || seen.userId),
    seenAt: seen.seenAt,
  }));
}

const ALLOWED_MESSAGE_TYPES = ["text", "emoji", "gif", "document", "media", "shared_post"];

function normalizeAttachment(file) {
  return {
    url: file?.url || "",
    fileName: file?.fileName || "",
    mimeType: file?.mimeType || "",
    size: file?.size || 0,
  };
}

function normalizeSharedPost(sharedPost) {
  if (!sharedPost || typeof sharedPost !== "object") return null;
  const images = Array.isArray(sharedPost.images)
    ? sharedPost.images.filter((image) => typeof image === "string" && image.trim()).slice(0, 4)
    : [];
  return {
    id: typeof sharedPost.id === "string" ? sharedPost.id.trim() : "",
    content: typeof sharedPost.content === "string" ? sharedPost.content.trim() : "",
    authorName: sharedPost.authorName || "UniLynk User",
    authorImage: sharedPost.authorImage || "",
    images,
    audience: sharedPost.audience === "clubs" ? "clubs" : "for-you",
    createdAt: sharedPost.createdAt ? new Date(sharedPost.createdAt) : null,
    url: typeof sharedPost.url === "string" ? sharedPost.url.trim() : "",
  };
}

function normalizeMessagePayload(payload = {}) {
  const messageType = ALLOWED_MESSAGE_TYPES.includes(payload.messageType) ? payload.messageType : "text";
  return {
    messageType,
    text: typeof payload.text === "string" ? payload.text.trim() : "",
    attachment: payload.attachment ? normalizeAttachment(payload.attachment) : null,
    attachments: Array.isArray(payload.attachments)
      ? payload.attachments.filter((item) => item?.url).map(normalizeAttachment)
      : [],
    sharedPost: normalizeSharedPost(payload.sharedPost),
  };
}

function formatMessage(message, usersById = new Map(), currentUserId = "") {
  const senderId = String(message.sender?._id || message.sender);
  const sender = usersById.get(senderId) || message.sender;
  const seenBy = formatSeenBy(message.seenBy);
  const readReceipt =
    senderId === currentUserId ? seenBy.find((seen) => seen.userId !== currentUserId)?.seenAt || null : null;

  return {
    id: String(message._id),
    senderId,
    senderName: sender?.name || sender?.email || "UniLynk User",
    senderImage: sender?.img || "",
    text: message.text || "",
    messageType: message.messageType || "text",
    attachment: message.attachment || null,
    attachments: message.attachments || [],
    sharedPost: message.sharedPost || null,
    createdAt: message.createdAt,
    deliveredAt: message.createdAt,
    readAt: readReceipt,
    seenBy,
    reactions: formatReactions(message.reactions),
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

    let shouldSaveSeenState = false;
    (group.messages || []).forEach((message) => {
      const senderId = String(message.sender?._id || message.sender);
      if (senderId === currentUserId) return;
      const alreadySeen = (message.seenBy || []).some((seen) => String(seen.userId) === currentUserId);
      if (alreadySeen) return;
      message.seenBy.push({ userId: currentUser._id, seenAt: new Date() });
      shouldSaveSeenState = true;
    });
    if (shouldSaveSeenState) await community.save();

    const visibleMessages = (group.messages || []).filter(
      (message) => !(message.deletedFor || []).some((userId) => String(userId) === currentUserId)
    );
    const senderIds = [...userIdSet(visibleMessages.map((message) => message.sender))];
    const senders = await User.find({ _id: { $in: senderIds } }).select("name email img").lean();
    const usersById = new Map(senders.map((user) => [String(user._id), user]));

    return NextResponse.json({ messages: visibleMessages.map((message) => formatMessage(message, usersById, currentUserId)) });
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

    const payload = normalizeMessagePayload(await req.json());
    if (!payload.text && payload.messageType === "text") {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    }
    if (payload.messageType === "document" && !payload.attachment?.url) {
      return NextResponse.json({ error: "Document URL is required" }, { status: 400 });
    }
    if (payload.messageType === "media" && !payload.attachments.length) {
      return NextResponse.json({ error: "At least one media file is required" }, { status: 400 });
    }
    if (payload.messageType === "shared_post" && !payload.sharedPost?.id) {
      return NextResponse.json({ error: "Shared post data is required" }, { status: 400 });
    }

    group.messages.push({
      sender: currentUser._id,
      text: payload.text,
      messageType: payload.messageType,
      attachment: payload.messageType === "document" ? payload.attachment : undefined,
      attachments: payload.messageType === "media" ? payload.attachments : undefined,
      sharedPost: payload.messageType === "shared_post" ? payload.sharedPost : undefined,
      seenBy: [{ userId: currentUser._id, seenAt: new Date() }],
    });
    if (group.messages.length > 200) {
      group.messages.splice(0, group.messages.length - 200);
    }
    group.updatedAt = new Date();
    community.updatedAt = new Date();

    await community.save();

    const savedMessage = group.messages[group.messages.length - 1];
    return NextResponse.json({
      ok: true,
      message: formatMessage(savedMessage, new Map([[currentUserId, currentUser]]), currentUserId),
    });
  } catch (error) {
    console.error("COMMUNITY MESSAGES POST ERROR:", error);
    return NextResponse.json({ error: "Failed to send group message" }, { status: 500 });
  }
}


export async function PATCH(req, context) {
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

    const { messageId, action, emoji } = await req.json();
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return NextResponse.json({ error: "Valid message id is required" }, { status: 400 });
    }

    const message = group.messages.id(messageId);
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (action === "toggle-reaction") {
      const trimmedEmoji = String(emoji || "").trim();
      if (!trimmedEmoji) {
        return NextResponse.json({ error: "Reaction emoji is required" }, { status: 400 });
      }
      const existingIndex = (message.reactions || []).findIndex(
        (reaction) => String(reaction.userId) === currentUserId && reaction.emoji === trimmedEmoji
      );
      if (existingIndex >= 0) {
        message.reactions.splice(existingIndex, 1);
      } else {
        message.reactions.push({ userId: currentUser._id, emoji: trimmedEmoji });
      }
      community.updatedAt = new Date();
      await community.save();
      return NextResponse.json({ ok: true, reactions: formatReactions(message.reactions) });
    }

    if (action === "mark-seen") {
      const alreadySeen = (message.seenBy || []).some((seen) => String(seen.userId) === currentUserId);
      if (!alreadySeen) {
        message.seenBy.push({ userId: currentUser._id, seenAt: new Date() });
        await community.save();
      }
      return NextResponse.json({ ok: true, seenBy: formatSeenBy(message.seenBy) });
    }

    return NextResponse.json({ error: "Unsupported message action" }, { status: 400 });
  } catch (error) {
    console.error("COMMUNITY MESSAGES PATCH ERROR:", error);
    return NextResponse.json({ error: "Failed to update group message" }, { status: 500 });
  }
}

export async function DELETE(req, context) {
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

    const { messageId, mode = "for-me" } = await req.json();
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return NextResponse.json({ error: "Valid message id is required" }, { status: 400 });
    }

    const message = group.messages.id(messageId);
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (mode === "for-everyone") {
      const isSender = String(message.sender?._id || message.sender) === currentUserId;
      const isAdmin = userIdSet(community.admins).has(currentUserId);
      if (!isSender && !isAdmin) {
        return NextResponse.json({ error: "Only the sender or an admin can delete for everyone" }, { status: 403 });
      }
      message.deleteOne();
    } else {
      const alreadyDeleted = (message.deletedFor || []).some((userId) => String(userId) === currentUserId);
      if (!alreadyDeleted) message.deletedFor.push(currentUser._id);
    }

    community.updatedAt = new Date();
    await community.save();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("COMMUNITY MESSAGES DELETE ERROR:", error);
    return NextResponse.json({ error: "Failed to delete group message" }, { status: 500 });
  }
}
