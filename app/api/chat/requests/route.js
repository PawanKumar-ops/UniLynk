import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import ChatMessage from "@/models/chatMessage";
import MessageRequest from "@/models/messageRequest";
import { triggerPusher, userChannel } from "@/lib/pusher";

async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  await connectDB();
  return User.findOne({ email: session.user.email });
}

function formatTime(date) {
  return new Date(date || Date.now()).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const currentUserId = currentUser._id;
    const requests = await MessageRequest.find({ recipient: currentUserId, status: "pending", deletedFor: { $ne: currentUserId } })
      .populate("requester", "name email img")
      .sort({ updatedAt: -1 })
      .lean();

    const items = await Promise.all(requests.map(async (request) => {
      const latest = await ChatMessage.findOne({ sender: request.requester._id, receiver: currentUserId, deletedFor: { $ne: currentUserId } }).sort({ createdAt: -1 }).lean();
      return {
        id: request.requester._id.toString(),
        requestId: request._id.toString(),
        user: {
          id: request.requester._id.toString(),
          name: request.requester.name || request.requester.email || "UniLynk User",
          handle: request.requester.email?.split("@")[0] || "user",
          avatar: request.requester.img || "/Profilepic.png",
        },
        preview: latest?.text || "Sent a message request",
        time: formatTime(latest?.createdAt || request.updatedAt),
        updatedAt: latest?.createdAt || request.updatedAt,
      };
    }));
    return Response.json({ requests: items, count: items.length });
  } catch (error) {
    console.error("MESSAGE REQUESTS GET ERROR:", error);
    return Response.json({ error: "Failed to load message requests" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const { requesterId, action } = await req.json();
    if (!requesterId || !mongoose.Types.ObjectId.isValid(requesterId)) return Response.json({ error: "Valid requesterId is required" }, { status: 400 });
    const request = await MessageRequest.findOne({ requester: requesterId, recipient: currentUser._id, status: "pending" });
    if (!request) return Response.json({ error: "Request not found" }, { status: 404 });

    if (action === "accept") {
      request.status = "accepted";
      request.acceptedAt = new Date();
      request.deletedFor = [];
      await request.save();
      await triggerPusher([userChannel(currentUser._id), userChannel(requesterId)], "message-requests-updated", {});
      return Response.json({ ok: true, status: "accepted" });
    }

    if (action === "delete") {
      if (!request.deletedFor.some((id) => id.toString() === currentUser._id.toString())) request.deletedFor.push(currentUser._id);
      await request.save();
      await triggerPusher([userChannel(currentUser._id)], "message-requests-updated", {});
      return Response.json({ ok: true, status: "deleted" });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("MESSAGE REQUESTS PATCH ERROR:", error);
    return Response.json({ error: "Failed to update message request" }, { status: 500 });
  }
}
