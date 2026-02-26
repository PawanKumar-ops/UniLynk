import mongoose from "mongoose";
import { Server } from "socket.io";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import ChatMessage from "@/models/chatMessage";

const ALLOWED_MESSAGE_TYPES = ["text", "emoji", "gif", "document", "media"];

function normalizeAttachment(file) {
  return {
    url: file?.url || "",
    fileName: file?.fileName || "",
    mimeType: file?.mimeType || "",
    size: file?.size || 0,
  };
}

function formatMessage(message) {
  return {
    id: message._id.toString(),
    text: message.text || "",
    messageType: message.messageType || "text",
    attachment: message.attachment || null,
    attachments: message.attachments || [],
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

      socket.on("send-message", async (payload, callback) => {
        try {
          const {
            senderId,
            receiverId,
            text,
            messageType = "text",
            attachment = null,
            attachments = [],
          } = payload || {};

          const normalizedType = ALLOWED_MESSAGE_TYPES.includes(messageType)
            ? messageType
            : "text";

          const trimmedText = typeof text === "string" ? text.trim() : "";
          const normalizedAttachment = attachment ? normalizeAttachment(attachment) : null;
          const normalizedAttachments = Array.isArray(attachments)
            ? attachments.filter((item) => item?.url).map(normalizeAttachment)
            : [];

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
