import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import ChatMessage from "@/models/chatMessage";
import User from "@/models/user";
import { triggerPusher, userChannel } from "@/lib/pusher";

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

    // Only the original sender can unsend for everyone; preserve attachments,
    // reactions, timestamps, and all other metadata on the same MongoDB document.
    const message = await ChatMessage.findOneAndUpdate(
      { _id: messageId, sender: currentUser._id },
      { $set: { deletedForEveryone: true } },
      { new: true }
    ).lean();

    if (!message) {
      return NextResponse.json({ error: "Only the sender can delete this message for everyone" }, { status: 403 });
    }

    const payload = {
      ok: true,
      messageId: String(message._id),
      mode: "for-everyone",
      userId: String(currentUser._id),
      deletedForEveryone: true,
    };
    await triggerPusher([userChannel(message.sender), userChannel(message.receiver)], "message-deleted", payload);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("CHAT DELETE FOR EVERYONE ERROR:", error);
    return NextResponse.json({ error: "Failed to delete message for everyone" }, { status: 500 });
  }
}
