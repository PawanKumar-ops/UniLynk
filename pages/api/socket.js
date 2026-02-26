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
          });

          const formattedMessage = {
            id: message._id.toString(),
            text: message.text || "",
            messageType: message.messageType || "text",
            attachment: message.attachment || null,
            attachments: message.attachments || [],
            sender: message.sender.toString(),
            receiver: message.receiver.toString(),
            createdAt: message.createdAt,
          };

          io.to(senderId).emit("new-message", formattedMessage);
          io.to(receiverId).emit("new-message", formattedMessage);

          callback?.({ ok: true, message: formattedMessage });
        } catch (error) {
          console.error("SOCKET SEND MESSAGE ERROR:", error);
          callback?.({ ok: false, error: "Failed to send message" });
        }
      });
    });

    res.socket.server.io = io;
  }

  res.end();
}
