import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getPusherServer } from "@/lib/pusher";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const pusher = getPusherServer();
  if (!pusher) return Response.json({ error: "Pusher is not configured" }, { status: 500 });
  const formData = await req.formData();
  const socketId = formData.get("socket_id");
  const channelName = formData.get("channel_name");
  return Response.json(pusher.authorizeChannel(socketId, channelName));
}
