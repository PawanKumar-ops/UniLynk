import { Server } from "socket.io";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import ChatMessage from "@/models/chatMessage";

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
          const { senderId, receiverId, text } = payload || {};

          if (!senderId || !receiverId || !text?.trim()) {
            callback?.({ ok: false, error: "Invalid payload" });
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
            text: text.trim(),
          });

          const formattedMessage = {
            id: message._id.toString(),
            text: message.text,
            sender: message.sender.toString(),
            receiver: message.receiver.toString(),
            createdAt: message.createdAt,
          };

          io.to(senderId).emit("new-message", formattedMessage);
          io.to(receiverId).emit("new-message", formattedMessage);

          callback?.({ ok: true });
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
