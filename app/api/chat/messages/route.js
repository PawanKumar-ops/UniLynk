import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import ChatMessage from "@/models/chatMessage";
import { directChatChannel, getPusherServer } from "@/lib/pusher";

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

    await getPusherServer()?.trigger(directChatChannel(currentUser._id, receiverId), "new-message", formattedMessage);

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

    const { messageId, action, emoji, mode, targetUserIds = [] } = await req.json();
    if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
      return Response.json({ error: "Valid messageId is required" }, { status: 400 });
    }

    const message = await ChatMessage.findById(messageId);
    if (!message) return Response.json({ error: "Message not found" }, { status: 404 });
    const isParticipant = [message.sender, message.receiver].some((id) => String(id) === String(currentUser._id));
    if (!isParticipant) return Response.json({ error: "Forbidden" }, { status: 403 });

    if (action === "toggle-reaction") {
      const trimmedEmoji = String(emoji || "").trim();
      if (!trimmedEmoji) return Response.json({ error: "Reaction emoji is required" }, { status: 400 });
      const existing = (message.reactions || []).findIndex(
        (reaction) => String(reaction.userId) === String(currentUser._id) && reaction.emoji === trimmedEmoji
      );
      if (existing >= 0) message.reactions.splice(existing, 1);
      else {
        message.reactions = (message.reactions || []).filter((reaction) => String(reaction.userId) !== String(currentUser._id));
        message.reactions.push({ userId: currentUser._id, emoji: trimmedEmoji });
      }
      await message.save();
      const reactions = (message.reactions || []).map((reaction) => ({ userId: String(reaction.userId), emoji: reaction.emoji }));
      await getPusherServer()?.trigger(directChatChannel(message.sender, message.receiver), "message-reactions-updated", { messageId, reactions });
      return Response.json({ reactions });
    }

    if (action === "delete") {
      if (mode === "everyone" && String(message.sender) === String(currentUser._id)) {
        message.deletedForEveryone = true;
      } else if (!(message.deletedFor || []).some((id) => String(id) === String(currentUser._id))) {
        message.deletedFor.push(currentUser._id);
      }
      await message.save();
      await getPusherServer()?.trigger(directChatChannel(message.sender, message.receiver), "message-deleted", {
        messageId,
        mode: mode === "everyone" ? "everyone" : "me",
        userId: String(currentUser._id),
        deletedForEveryone: Boolean(message.deletedForEveryone),
      });
      return Response.json({ ok: true, deletedForEveryone: Boolean(message.deletedForEveryone) });
    }

    if (action === "forward") {
      const ids = Array.isArray(targetUserIds) ? targetUserIds.filter((id) => mongoose.Types.ObjectId.isValid(id)) : [];
      const created = [];
      for (const receiverId of ids) {
        const forwarded = await ChatMessage.create({
          sender: currentUser._id,
          receiver: receiverId,
          text: message.text || "",
          messageType: message.messageType || "text",
          attachment: message.attachment || undefined,
          attachments: message.attachments || undefined,
          sharedPost: message.sharedPost || undefined,
          deliveredAt: new Date(),
          reactions: [],
        });
        const formatted = { id: String(forwarded._id), text: forwarded.text || "", messageType: forwarded.messageType || "text", attachment: forwarded.attachment || null, attachments: forwarded.attachments || [], sharedPost: forwarded.sharedPost || null, sender: String(forwarded.sender), receiver: String(forwarded.receiver), createdAt: forwarded.createdAt, deliveredAt: forwarded.deliveredAt || null, readAt: null, deletedForEveryone: false, reactions: [] };
        created.push(formatted);
        await getPusherServer()?.trigger(directChatChannel(currentUser._id, receiverId), "new-message", formatted);
      }
      return Response.json({ messages: created });
    }

    return Response.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    console.error("CHAT MESSAGES PATCH ERROR:", error);
    return Response.json({ error: "Failed to update message" }, { status: 500 });
  }
}
