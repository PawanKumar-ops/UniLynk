import mongoose from "mongoose";
import { Server } from "socket.io";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import ChatMessage from "@/models/chatMessage";
import Community from "@/models/Community";

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


function userIdSet(values = []) {
  return new Set(values.filter(Boolean).map((value) => String(value?._id || value)));
}

function formatCommunityReactions(reactions = []) {
  return (reactions || []).map((reaction) => ({
    userId: String(reaction.userId?._id || reaction.userId),
    emoji: reaction.emoji || "",
  }));
}

function formatCommunitySeenBy(seenBy = []) {
  return (seenBy || []).map((seen) => ({
    userId: String(seen.userId?._id || seen.userId),
    seenAt: seen.seenAt,
  }));
}

function formatCommunityMessage(message, senderUser = null, currentUserId = "") {
  const senderId = String(message.sender?._id || message.sender);
  const seenBy = formatCommunitySeenBy(message.seenBy);
  const readReceipt =
    senderId === currentUserId ? seenBy.find((seen) => seen.userId !== currentUserId)?.seenAt || null : null;

  return {
    id: String(message._id),
    senderId,
    senderName: senderUser?.name || senderUser?.email || "UniLynk User",
    senderImage: senderUser?.img || "",
    text: message.text || "",
    messageType: message.messageType || "text",
    attachment: message.attachment || null,
    attachments: message.attachments || [],
    sharedPost: message.sharedPost || null,
    createdAt: message.createdAt,
    deliveredAt: message.createdAt,
    readAt: readReceipt,
    seenBy,
    reactions: formatCommunityReactions(message.reactions),
  };
}

function normalizeForwardPayload(payload = {}) {
  const messageType = ALLOWED_MESSAGE_TYPES.includes(payload.messageType) ? payload.messageType : "text";
  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  const attachment = payload.attachment ? normalizeAttachment(payload.attachment) : null;
  const attachments = Array.isArray(payload.attachments)
    ? payload.attachments.filter((item) => item?.url).map(normalizeAttachment)
    : [];
  const sharedPost = normalizeSharedPost(payload.sharedPost);

  return { messageType, text, attachment, attachments, sharedPost };
}

function formatMessage(message) {
  return {
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
    reactions: (message.reactions || []).map((reaction) => ({
      userId: reaction.userId?.toString?.() || reaction.userId,
      emoji: reaction.emoji || "",
    })),
  };
}

export default function handler(req, res) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: "/api/socket_io",
      addTrailingSlash: false,
    });

    io.on("connection", (socket) => {
      socket.on("register-user", (userId) => {
        if (!userId) return;
        socket.data.userId = userId;
        socket.join(userId);
      });

      socket.on("join-community", async (payload, callback) => {
        try {
          const { communityId, userId } = payload || {};
          if (!communityId || !userId || socket.data.userId !== userId) {
            callback?.({ ok: false, error: "Invalid payload" });
            return;
          }
          if (!mongoose.Types.ObjectId.isValid(communityId) || !mongoose.Types.ObjectId.isValid(userId)) {
            callback?.({ ok: false, error: "Invalid ids" });
            return;
          }

          await connectDB();
          const community = await Community.findById(communityId).select("members groups.members").lean();
          const isMember = (community?.members || []).some((memberId) => String(memberId) === userId);
          if (!community || !isMember) {
            callback?.({ ok: false, error: "Unauthorized" });
            return;
          }

          socket.join(`community:${communityId}`);
          (community.groups || []).forEach((group) => {
            const groupMembers = group.members?.length ? group.members : community.members;
            if ((groupMembers || []).some((memberId) => String(memberId) === userId)) {
              socket.join(`community:${communityId}:group:${group._id}`);
            }
          });

          callback?.({ ok: true });
        } catch (error) {
          console.error("SOCKET JOIN COMMUNITY ERROR:", error);
          callback?.({ ok: false, error: "Failed to join community" });
        }
      });

      socket.on("send-community-message", async (payload, callback) => {
        try {
          const { communityId, groupId, senderId } = payload || {};
          if (!communityId || !groupId || !senderId || socket.data.userId !== senderId) {
            callback?.({ ok: false, error: "Invalid payload" });
            return;
          }
          if (
            !mongoose.Types.ObjectId.isValid(communityId) ||
            !mongoose.Types.ObjectId.isValid(groupId) ||
            !mongoose.Types.ObjectId.isValid(senderId)
          ) {
            callback?.({ ok: false, error: "Invalid ids" });
            return;
          }

          const { messageType, text, attachment, attachments, sharedPost } = normalizeForwardPayload(payload);
          if (!text && messageType === "text") {
            callback?.({ ok: false, error: "Message text is required" });
            return;
          }
          if (messageType === "document" && !attachment?.url) {
            callback?.({ ok: false, error: "Document URL is required" });
            return;
          }
          if (messageType === "media" && !attachments.length) {
            callback?.({ ok: false, error: "At least one media file is required" });
            return;
          }
          if (messageType === "shared_post" && !sharedPost?.id) {
            callback?.({ ok: false, error: "Shared post data is required" });
            return;
          }

          await connectDB();
          const [community, senderUser] = await Promise.all([
            Community.findById(communityId),
            User.findById(senderId).select("_id name email img"),
          ]);
          const group = community?.groups.id(groupId);
          if (!community || !group || !senderUser) {
            callback?.({ ok: false, error: "Not found" });
            return;
          }

          const groupMembers = userIdSet(group.members?.length ? group.members : community.members);
          if (!groupMembers.has(senderId)) {
            callback?.({ ok: false, error: "You are not a member of this group" });
            return;
          }
          if (group.isAnnouncement && !userIdSet(community.admins).has(senderId)) {
            callback?.({ ok: false, error: "Only community admins can post announcements" });
            return;
          }

          group.messages.push({
            sender: senderUser._id,
            text,
            messageType,
            attachment: messageType === "document" ? attachment : undefined,
            attachments: messageType === "media" ? attachments : undefined,
            sharedPost: messageType === "shared_post" ? sharedPost : undefined,
            seenBy: [{ userId: senderUser._id, seenAt: new Date() }],
            reactions: [],
          });
          if (group.messages.length > 200) {
            group.messages.splice(0, group.messages.length - 200);
          }
          group.updatedAt = new Date();
          community.updatedAt = new Date();
          await community.save();

          const savedMessage = group.messages[group.messages.length - 1];
          const formattedMessage = formatCommunityMessage(savedMessage, senderUser, senderId);
          const eventPayload = { communityId, groupId, message: formattedMessage };
          io.to(`community:${communityId}:group:${groupId}`).emit("new-community-message", eventPayload);
          callback?.({ ok: true, message: formattedMessage });
        } catch (error) {
          console.error("SOCKET SEND COMMUNITY MESSAGE ERROR:", error);
          callback?.({ ok: false, error: "Failed to send group message" });
        }
      });

      socket.on("toggle-community-reaction", async (payload, callback) => {
        try {
          const { communityId, groupId, messageId, userId, emoji } = payload || {};
          if (!communityId || !groupId || !messageId || !userId || !emoji || socket.data.userId !== userId) {
            callback?.({ ok: false, error: "Invalid payload" });
            return;
          }
          if (
            !mongoose.Types.ObjectId.isValid(communityId) ||
            !mongoose.Types.ObjectId.isValid(groupId) ||
            !mongoose.Types.ObjectId.isValid(messageId) ||
            !mongoose.Types.ObjectId.isValid(userId)
          ) {
            callback?.({ ok: false, error: "Invalid ids" });
            return;
          }

          await connectDB();
          const community = await Community.findById(communityId);
          const group = community?.groups.id(groupId);
          const message = group?.messages.id(messageId);
          if (!community || !group || !message) {
            callback?.({ ok: false, error: "Message not found" });
            return;
          }
          const groupMembers = userIdSet(group.members?.length ? group.members : community.members);
          if (!groupMembers.has(userId)) {
            callback?.({ ok: false, error: "Unauthorized" });
            return;
          }

          const trimmedEmoji = String(emoji).trim();
          const existingIndex = (message.reactions || []).findIndex(
            (reaction) => String(reaction.userId) === userId && reaction.emoji === trimmedEmoji
          );
          if (existingIndex >= 0) message.reactions.splice(existingIndex, 1);
          else message.reactions.push({ userId, emoji: trimmedEmoji });

          community.updatedAt = new Date();
          await community.save();

          const eventPayload = {
            communityId,
            groupId,
            messageId,
            reactions: formatCommunityReactions(message.reactions),
          };
          io.to(`community:${communityId}:group:${groupId}`).emit("community-message-reactions-updated", eventPayload);
          callback?.({ ok: true, ...eventPayload });
        } catch (error) {
          console.error("SOCKET TOGGLE COMMUNITY REACTION ERROR:", error);
          callback?.({ ok: false, error: "Failed to update reaction" });
        }
      });

      socket.on("send-message", async (payload, callback) => {
        try {
          const {
            senderId,
            receiverId,
            text,
            messageType = "text",
            attachment = null,
            attachments = [],
            sharedPost = null,
          } = payload || {};

          const normalizedType = ALLOWED_MESSAGE_TYPES.includes(messageType)
            ? messageType
            : "text";

          const trimmedText = typeof text === "string" ? text.trim() : "";
          const normalizedAttachment = attachment ? normalizeAttachment(attachment) : null;
          const normalizedAttachments = Array.isArray(attachments)
            ? attachments.filter((item) => item?.url).map(normalizeAttachment)
            : [];
          const normalizedSharedPost = normalizeSharedPost(sharedPost);

          if (!senderId || !receiverId || (!trimmedText && normalizedType === "text")) {
            callback?.({ ok: false, error: "Invalid payload" });
            return;
          }

          if (normalizedType === "document" && !normalizedAttachment?.url) {
            callback?.({ ok: false, error: "Document URL is required" });
            return;
          }

          if (normalizedType === "media" && !normalizedAttachments.length) {
            callback?.({ ok: false, error: "At least one media file is required" });
            return;
          }

          if (normalizedType === "shared_post" && !normalizedSharedPost?.id) {
            callback?.({ ok: false, error: "Shared post data is required" });
            return;
          }


          if (socket.data.userId !== senderId) {
            callback?.({ ok: false, error: "Sender mismatch" });
            return;
          }

          await connectDB();

          const [senderUser, receiverUser] = await Promise.all([
            User.findById(senderId).select("_id"),
            User.findById(receiverId).select("_id"),
          ]);

          if (!senderUser || !receiverUser) {
            callback?.({ ok: false, error: "User not found" });
            return;
          }

          const message = await ChatMessage.create({
            sender: senderUser._id,
            receiver: receiverUser._id,
            text: trimmedText,
            messageType: normalizedType,
            attachment: normalizedAttachment || undefined,
            attachments: normalizedType === "media" ? normalizedAttachments : undefined,
            sharedPost: normalizedType === "shared_post" ? normalizedSharedPost : undefined,
            deliveredAt: new Date(),
            readAt: null,
            reactions: [],
          });

          const formattedMessage = formatMessage(message);

          io.to(senderId).emit("new-message", formattedMessage);
          io.to(receiverId).emit("new-message", formattedMessage);

          callback?.({ ok: true, message: formattedMessage });
        } catch (error) {
          console.error("SOCKET SEND MESSAGE ERROR:", error);
          callback?.({ ok: false, error: "Failed to send message" });
        }
      });

           socket.on("toggle-reaction", async (payload, callback) => {
        try {
          const { messageId, userId, emoji } = payload || {};

          if (!messageId || !userId || !emoji) {
            callback?.({ ok: false, error: "Invalid payload" });
            return;
          }

          if (!mongoose.Types.ObjectId.isValid(messageId) || !mongoose.Types.ObjectId.isValid(userId)) {
            callback?.({ ok: false, error: "Invalid ids" });
            return;
          }

          await connectDB();

          const [message, reactingUser] = await Promise.all([
            ChatMessage.findById(messageId),
            User.findById(userId).select("_id"),
          ]);

          if (!message || !reactingUser) {
            callback?.({ ok: false, error: "Message or user not found" });
            return;
          }

          const isThreadMember =
            message.sender.toString() === userId || message.receiver.toString() === userId;

          if (!isThreadMember) {
            callback?.({ ok: false, error: "Unauthorized" });
            return;
          }

          const existingIndex = (message.reactions || []).findIndex(
            (reaction) =>
              reaction.userId?.toString() === userId &&
              reaction.emoji === emoji
          );

          if (existingIndex >= 0) {
            message.reactions.splice(existingIndex, 1);
          } else {
            message.reactions.push({ userId, emoji });
          }

          await message.save();

          const eventPayload = {
            messageId: message._id.toString(),
            reactions: (message.reactions || []).map((reaction) => ({
              userId: reaction.userId?.toString?.() || reaction.userId,
              emoji: reaction.emoji || "",
            })),
          };

          io.to(message.sender.toString()).emit("message-reactions-updated", eventPayload);
          io.to(message.receiver.toString()).emit("message-reactions-updated", eventPayload);

          callback?.({ ok: true, ...eventPayload });
        } catch (error) {
          console.error("SOCKET TOGGLE REACTION ERROR:", error);
          callback?.({ ok: false, error: "Failed to update reaction" });
        }
      });

      socket.on("forward-message", async (payload, callback) => {
        try {
          const { messageId, senderId, receiverId } = payload || {};

          if (!messageId || !senderId || !receiverId || socket.data.userId !== senderId) {
            callback?.({ ok: false, error: "Invalid payload" });
            return;
          }

          if (
            !mongoose.Types.ObjectId.isValid(messageId) ||
            !mongoose.Types.ObjectId.isValid(senderId) ||
            !mongoose.Types.ObjectId.isValid(receiverId)
          ) {
            callback?.({ ok: false, error: "Invalid ids" });
            return;
          }

          await connectDB();

          const [originalMessage, senderUser, receiverUser] = await Promise.all([
            ChatMessage.findById(messageId),
            User.findById(senderId).select("_id"),
            User.findById(receiverId).select("_id"),
          ]);

          if (!originalMessage || !senderUser || !receiverUser) {
            callback?.({ ok: false, error: "Not found" });
            return;
          }

          const canForward =
            originalMessage.sender.toString() === senderId ||
            originalMessage.receiver.toString() === senderId;

          if (!canForward) {
            callback?.({ ok: false, error: "Unauthorized" });
            return;
          }

          const forwardedMessage = await ChatMessage.create({
            sender: senderUser._id,
            receiver: receiverUser._id,
            text: originalMessage.text || "",
            messageType: originalMessage.messageType || "text",
            attachment: originalMessage.attachment || undefined,
            attachments: originalMessage.attachments || undefined,
            deliveredAt: new Date(),
            readAt: null,
            reactions: [],
          });

          const formattedMessage = formatMessage(forwardedMessage);

          io.to(senderId).emit("new-message", formattedMessage);
          io.to(receiverId).emit("new-message", formattedMessage);

          callback?.({ ok: true, message: formattedMessage });
        } catch (error) {
          console.error("SOCKET FORWARD MESSAGE ERROR:", error);
          callback?.({ ok: false, error: "Failed to forward message" });
        }
      });

     socket.on("delete-message", async (payload, callback) => {
        try {
          const { messageId, userId, mode = "for-everyone" } = payload || {};

          if (!messageId || !userId || socket.data.userId !== userId) {
            callback?.({ ok: false, error: "Invalid payload" });
            return;
          }

          if (!mongoose.Types.ObjectId.isValid(messageId) || !mongoose.Types.ObjectId.isValid(userId)) {
            callback?.({ ok: false, error: "Invalid ids" });
            return;
          }

          await connectDB();

          const message = await ChatMessage.findById(messageId);
          if (!message) {
            callback?.({ ok: false, error: "Message not found" });
            return;
          }

          const isThreadMember =
            message.sender.toString() === userId || message.receiver.toString() === userId;

          if (!isThreadMember) {
            callback?.({ ok: false, error: "Unauthorized" });
            return;
          }

          const senderId = message.sender.toString();
          const receiverId = message.receiver.toString();

          if (mode === "for-me") {
            const alreadyDeletedForUser = (message.deletedFor || []).some(
              (id) => id.toString() === userId
            );

            if (!alreadyDeletedForUser) {
              message.deletedFor = [...(message.deletedFor || []), userId];
              await message.save();
            }

            const eventPayload = { messageId: message._id.toString(), mode: "for-me", userId };
            io.to(userId).emit("message-deleted", eventPayload);
            callback?.({ ok: true, ...eventPayload });
            return;
          }

          if (message.sender.toString() !== userId) {
            callback?.({ ok: false, error: "Only sender can unsend for everyone" });
            return;
          }

          await ChatMessage.deleteOne({ _id: message._id });

          const eventPayload = { messageId: message._id.toString(), mode: "for-everyone", userId };
          io.to(senderId).emit("message-deleted", eventPayload);
          io.to(receiverId).emit("message-deleted", eventPayload);

          callback?.({ ok: true, ...eventPayload });
        } catch (error) {
          console.error("SOCKET DELETE MESSAGE ERROR:", error);
          callback?.({ ok: false, error: "Failed to delete message" });
        }
      });


      socket.on("mark-messages-read", async (payload, callback) => {
        try {
          const { currentUserId, otherUserId } = payload || {};

          if (!currentUserId || !otherUserId || socket.data.userId !== currentUserId) {
            callback?.({ ok: false, error: "Invalid payload" });
            return;
          }

          await connectDB();

          const now = new Date();
          await ChatMessage.updateMany(
            {
              sender: otherUserId,
              receiver: currentUserId,
              readAt: null,
            },
            {
              $set: {
                deliveredAt: now,
                readAt: now,
              },
            }
          );

          io.to(currentUserId).emit("messages-read", { byUserId: currentUserId, peerUserId: otherUserId, readAt: now });
          io.to(otherUserId).emit("messages-read", { byUserId: currentUserId, peerUserId: otherUserId, readAt: now });

          callback?.({ ok: true, readAt: now });
        } catch (error) {
          console.error("SOCKET MARK READ ERROR:", error);
          callback?.({ ok: false, error: "Failed to mark messages as read" });
        }
      });
    });

    res.socket.server.io = io;
  }

  res.end();
}
