import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import Community from "@/models/Community";
import { pusherServer } from "@/lib/pusher";

export async function POST(req) {
  try {
    if (!pusherServer) return Response.json({ error: "Pusher is not configured" }, { status: 500 });
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const user = await User.findOne({ email: session.user.email.toLowerCase().trim() }).select("_id");
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const form = await req.formData();
    const socketId = form.get("socket_id");
    const channelName = form.get("channel_name");
    if (!socketId || !channelName) return Response.json({ error: "Invalid auth request" }, { status: 400 });
    const currentUserId = String(user._id);
    let allowed = channelName === `private-user-${currentUserId}`;
    if (!allowed && channelName.startsWith("private-community-")) {
      const communityId = channelName.replace("private-community-", "");
      allowed = !!(await Community.exists({ _id: communityId, members: user._id }));
    }
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });
    return Response.json(pusherServer.authorizeChannel(socketId, channelName));
  } catch (error) {
    console.error("PUSHER AUTH ERROR:", error);
    return Response.json({ error: "Failed to authorize pusher" }, { status: 500 });
  }
}
