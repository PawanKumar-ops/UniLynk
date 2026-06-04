import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import ChatMessage from "@/models/chatMessage";
import User from "@/models/user";

async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  await connectDB();
  return User.findOne({ email: session.user.email.toLowerCase().trim() }).select("_id");
}

export async function POST(_req, context) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { messageId } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return NextResponse.json({ error: "Valid message id is required" }, { status: 400 });
    }

    // Delete for me is a per-user visibility update: never remove the message document.
    const message = await ChatMessage.findOneAndUpdate(
      {
        _id: messageId,
        $or: [{ sender: currentUser._id }, { receiver: currentUser._id }],
      },
      { $addToSet: { deletedFor: currentUser._id } },
      { new: true }
    ).lean();

    if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    return NextResponse.json({
      ok: true,
      messageId: String(message._id),
      mode: "for-me",
      userId: String(currentUser._id),
    });
  } catch (error) {
    console.error("CHAT DELETE FOR ME ERROR:", error);
    return NextResponse.json({ error: "Failed to delete message for you" }, { status: 500 });
  }
}
