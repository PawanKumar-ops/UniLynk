import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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
    })
      .sort({ createdAt: 1 })
      .lean();

    const formattedMessages = messages.map((msg) => ({
      id: msg._id.toString(),
      text: msg.text || "",
      messageType: msg.messageType || "text",
      attachment: msg.attachment || null,
      attachments: msg.attachments || [],
      sender: msg.sender.toString(),
      receiver: msg.receiver.toString(),
      createdAt: msg.createdAt,
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
    } = await req.json();

    if (!receiverId || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return Response.json({ error: "Valid receiverId is required" }, { status: 400 });
    }

    const normalizedType = ALLOWED_MESSAGE_TYPES.includes(messageType)
      ? messageType
      : "text";

    const trimmedText = typeof text === "string" ? text.trim() : "";
    const normalizedAttachment = attachment ? normalizeAttachment(attachment) : null;
    const normalizedAttachments = Array.isArray(attachments)
      ? attachments.filter((item) => item?.url).map(normalizeAttachment)
      : [];

    if (!trimmedText && normalizedType === "text") {
      return Response.json({ error: "Message text is required" }, { status: 400 });
    }

    if (normalizedType === "document" && !normalizedAttachment?.url) {
      return Response.json({ error: "Attachment URL is required for documents" }, { status: 400 });
    }

    if (normalizedType === "media" && !normalizedAttachments.length) {
      return Response.json({ error: "At least one media file is required" }, { status: 400 });
    }

    const message = await ChatMessage.create({
      sender: currentUser._id,
      receiver: receiverId,
      text: trimmedText,
      messageType: normalizedType,
      attachment: normalizedAttachment || undefined,
      attachments: normalizedType === "media" ? normalizedAttachments : undefined,
    });

    return Response.json(
      {
        message: {
          id: message._id.toString(),
          text: message.text || "",
          messageType: message.messageType || "text",
          attachment: message.attachment || null,
          attachments: message.attachments || [],
          sender: message.sender.toString(),
          receiver: message.receiver.toString(),
          createdAt: message.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CHAT MESSAGES POST ERROR:", error);
    return Response.json({ error: "Failed to send message" }, { status: 500 });
  }
}
