import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import ChatMessage from "@/models/chatMessage";
import MessageRequest from "@/models/messageRequest";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return Response.json({ error: "Current user not found" }, { status: 404 });
    }

    const blockedUsers = (currentUser.blockedUsers || []).map((id) => id.toString());
    const usersWhoBlockedMe = await User.find({ blockedUsers: currentUser._id }).select("_id").lean();
    const blockedBy = usersWhoBlockedMe.map((u) => u._id.toString());

    const visibleRequests = await MessageRequest.find({
      $or: [
        { status: "accepted", $or: [{ requester: currentUser._id }, { recipient: currentUser._id }] },
        { status: "pending", requester: currentUser._id },
      ],
      deletedFor: { $ne: currentUser._id },
    }).lean();
    const requestByUserId = new Map();
    for (const request of visibleRequests) {
      const otherUserId = request.requester.toString() === currentUser._id.toString()
        ? request.recipient.toString()
        : request.requester.toString();
      requestByUserId.set(otherUserId, request);
    }
    const conversationUserIds = Array.from(requestByUserId.keys());

    const users = await User.find({ _id: { $ne: currentUser._id } })
      .select("name email img")
      .sort({ name: 1 });

    const conversationUsers = await User.find({ _id: { $in: conversationUserIds } })
      .select("name email img")
      .sort({ name: 1 });

    const mappedUsers = users.map((user) => ({
      id: user._id.toString(),
      name: user.name || user.email,
      email: user.email,
      image: user.img || null,
    }));

    const conversations = await Promise.all(conversationUsers.map(async (user) => {
      const latest = await ChatMessage.findOne({
        $or: [
          { sender: currentUser._id, receiver: user._id },
          { sender: user._id, receiver: currentUser._id },
        ],
        deletedFor: { $ne: currentUser._id },
      }).sort({ createdAt: -1 }).lean();
      const request = requestByUserId.get(user._id.toString());
      const isPendingSentRequest = request?.status === "pending" && request.requester.toString() === currentUser._id.toString();
      return {
        id: user._id.toString(),
        name: user.name || user.email,
        email: user.email,
        image: user.img || null,
        lastMessage: latest?.text || (isPendingSentRequest ? "Message request sent" : user.email || "Start a conversation"),
        lastMessageAt: latest?.createdAt || request?.updatedAt || null,
        unreadCount: latest && latest.receiver?.toString() === currentUser._id.toString() && !latest.readAt ? 1 : 0,
        requestStatus: request?.status || null,
        requestRole: request?.requester.toString() === currentUser._id.toString() ? "requester" : "recipient",
      };
    }));

    return Response.json({
      currentUserId: currentUser._id.toString(),
      blockedUsers,
      blockedBy,
      users: mappedUsers,
      conversations,
    });
  } catch (error) {
    console.error("CHAT USERS ERROR:", error);
    return Response.json({ error: "Failed to load users" }, { status: 500 });
  }
}
