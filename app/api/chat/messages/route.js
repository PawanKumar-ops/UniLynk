import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import ChatMessage from "@/models/chatMessage";
import { triggerPusher, userChannel } from "@/lib/pusher";

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

  const normalizedImages = Array.isArray(sharedPost.images)
    ? sharedPost.images.filter((image) => typeof image === "string" && image.trim()).slice(0, 4)
    : [];

  return {
    id: typeof sharedPost.id === "string" ? sharedPost.id.trim() : "",
    content: typeof sharedPost.content === "string" ? sharedPost.content.trim() : "",
    authorName:
      typeof sharedPost.authorName === "string" && sharedPost.authorName.trim()
        ? sharedPost.authorName.trim()
        : "UniLynk User",
    authorImage: typeof sharedPost.authorImage === "string" ? sharedPost.authorImage.trim() : "",
    images: normalizedImages,
    audience: sharedPost.audience === "clubs" ? "clubs" : "for-you",
    createdAt: sharedPost.createdAt ? new Date(sharedPost.createdAt) : null,
    url: typeof sharedPost.url === "string" ? sharedPost.url.trim() : "",
  };
}

async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  await connectDB();
  return User.findOne({ email: session.user.email });
}

export async function GET(req) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const otherUserId = searchParams.get("userId");

    if (!otherUserId || !mongoose.Types.ObjectId.isValid(otherUserId)) {
      return Response.json({ error: "Valid userId is required" }, { status: 400 });
    }

    const messages = await ChatMessage.find({
      $or: [
        { sender: currentUser._id, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUser._id },
      ],
      // Hide only messages this user removed for themselves; keep everyone-deleted
      // messages visible so the client can render the deletion placeholder.
      deletedFor: { $ne: currentUser._id },
    })
      .sort({ createdAt: 1 })
      .lean();

    const formattedMessages = messages.map((msg) => ({
      id: msg._id.toString(),
      text: msg.text || "",
      messageType: msg.messageType || "text",
      attachment: msg.attachment || null,
      attachments: msg.attachments || [],
      sharedPost: msg.sharedPost || null,
      sender: msg.sender.toString(),
      receiver: msg.receiver.toString(),
      createdAt: msg.createdAt,
      deliveredAt: msg.deliveredAt || null,
      readAt: msg.readAt || null,
      deletedForEveryone: Boolean(msg.deletedForEveryone),
      reactions: (msg.reactions || []).map((reaction) => ({
        userId: reaction.userId?.toString?.() || reaction.userId,
        emoji: reaction.emoji || "",
      })),
    }));

    return Response.json({ messages: formattedMessages });
  } catch (error) {
    console.error("CHAT MESSAGES GET ERROR:", error);
    return Response.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      receiverId,
      text,
      messageType = "text",
      attachment = null,
      attachments = [],
      sharedPost = null,
    } = await req.json();

    if (!receiverId || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return Response.json({ error: "Valid receiverId is required" }, { status: 400 });
    }

    const receiverUser = await User.findById(receiverId).select("blockedUsers");
    if (!receiverUser) {
      return Response.json({ error: "Receiver not found" }, { status: 404 });
    }

    const isBlockedByReceiver = (receiverUser.blockedUsers || []).some(
      (id) => id.toString() === currentUser._id.toString()
    );
    if (isBlockedByReceiver) {
      return Response.json({ error: "You are blocked by this user." }, { status: 403 });
    }

    const isBlockedBySender = (currentUser.blockedUsers || []).some(
      (id) => id.toString() === receiverId
    );
    if (isBlockedBySender) {
      return Response.json({ error: "You have blocked this user. Unblock to send messages." }, { status: 403 });
    }

    const normalizedType = ALLOWED_MESSAGE_TYPES.includes(messageType)
      ? messageType
      : "text";

    const trimmedText = typeof text === "string" ? text.trim() : "";
    const normalizedAttachment = attachment ? normalizeAttachment(attachment) : null;
    const normalizedAttachments = Array.isArray(attachments)
      ? attachments.filter((item) => item?.url).map(normalizeAttachment)
      : [];
    const normalizedSharedPost = normalizeSharedPost(sharedPost);

    if (!trimmedText && normalizedType === "text") {
      return Response.json({ error: "Message text is required" }, { status: 400 });
    }

    if (normalizedType === "document" && !normalizedAttachment?.url) {
      return Response.json({ error: "Attachment URL is required for documents" }, { status: 400 });
    }

    if (normalizedType === "media" && !normalizedAttachments.length) {
      return Response.json({ error: "At least one media file is required" }, { status: 400 });
    }

    if (normalizedType === "shared_post" && !normalizedSharedPost?.id) {
      return Response.json({ error: "Shared post data is required" }, { status: 400 });
    }

    const message = await ChatMessage.create({
      sender: currentUser._id,
      receiver: receiverId,
      text: trimmedText,
      messageType: normalizedType,
      attachment: normalizedAttachment || undefined,
      attachments: normalizedType === "media" ? normalizedAttachments : undefined,
      sharedPost: normalizedType === "shared_post" ? normalizedSharedPost : undefined,
      deliveredAt: new Date(),
      readAt: null,
      reactions: [],
    });

    const formattedMessage = {
      id: message._id.toString(),
      text: message.text || "",
      messageType: message.messageType || "text",
      attachment: message.attachment || null,
      attachments: message.attachments || [],
      sharedPost: message.sharedPost || null,
      sender: message.sender.toString(),
      receiver: message.receiver.toString(),
      createdAt: message.createdAt,
      deliveredAt: message.deliveredAt || null,
      readAt: message.readAt || null,
      deletedForEveryone: Boolean(message.deletedForEveryone),
      reactions: (message.reactions || []).map((reaction) => ({
        userId: reaction.userId?.toString?.() || reaction.userId,
        emoji: reaction.emoji || "",
      })),
    };

    await triggerPusher([userChannel(currentUser._id), userChannel(receiverId)], "new-message", formattedMessage);

    return Response.json({ message: formattedMessage }, { status: 201 });
  } catch (error) {
    console.error("CHAT MESSAGES POST ERROR:", error);
    return Response.json({ error: "Failed to send message" }, { status: 500 });
  }
}


export async function PATCH(req) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const { action, messageId, emoji, otherUserId } = await req.json();

    if (action === "mark-read") {
      if (!otherUserId || !mongoose.Types.ObjectId.isValid(otherUserId)) {
        return Response.json({ error: "Valid otherUserId is required" }, { status: 400 });
      }
      const readAt = new Date();
      await ChatMessage.updateMany(
        { sender: otherUserId, receiver: currentUser._id, readAt: null },
        { $set: { readAt, deliveredAt: readAt } }
      );
      await triggerPusher([userChannel(currentUser._id), userChannel(otherUserId)], "messages-read", {
        byUserId: currentUser._id.toString(),
        peerUserId: otherUserId,
        readAt,
      });
      return Response.json({ ok: true, readAt });
    }

    if (action !== "toggle-reaction" || !messageId || !mongoose.Types.ObjectId.isValid(messageId) || !emoji) {
      return Response.json({ error: "Invalid reaction request" }, { status: 400 });
    }

    const message = await ChatMessage.findOne({
      _id: messageId,
      $or: [{ sender: currentUser._id }, { receiver: currentUser._id }],
    });
    if (!message) return Response.json({ error: "Message not found" }, { status: 404 });

    const currentUserId = currentUser._id.toString();
    const existingIndex = (message.reactions || []).findIndex((r) => r.userId?.toString() === currentUserId);
    if (existingIndex >= 0 && message.reactions[existingIndex].emoji === emoji) {
      message.reactions.splice(existingIndex, 1);
    } else if (existingIndex >= 0) {
      message.reactions[existingIndex].emoji = emoji;
    } else {
      message.reactions.push({ userId: currentUser._id, emoji });
    }
    await message.save();
    const reactions = (message.reactions || []).map((reaction) => ({
      userId: reaction.userId?.toString?.() || reaction.userId,
      emoji: reaction.emoji || "",
    }));
    await triggerPusher([userChannel(message.sender), userChannel(message.receiver)], "message-reactions-updated", { messageId, reactions });
    return Response.json({ ok: true, reactions });
  } catch (error) {
    console.error("CHAT MESSAGES PATCH ERROR:", error);
    return Response.json({ error: "Failed to update message" }, { status: 500 });
  }
}
