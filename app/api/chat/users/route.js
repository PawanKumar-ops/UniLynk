import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

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

    const users = await User.find({ _id: { $ne: currentUser._id } })
      .select("name email image")
      .sort({ name: 1 });

    const mappedUsers = users.map((user) => ({
      id: user._id.toString(),
      name: user.name || user.email,
      email: user.email,
      image: user.image || null,
    }));

    return Response.json({
      currentUserId: currentUser._id.toString(),
      users: mappedUsers,
    });
  } catch (error) {
    console.error("CHAT USERS ERROR:", error);
    return Response.json({ error: "Failed to load users" }, { status: 500 });
  }
}
