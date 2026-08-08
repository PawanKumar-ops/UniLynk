import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const user = await User.findOne({ email: session.user.email }).select("-password").lean();

    if (!user) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    return Response.json({ user }, { status: 200 });
  } catch (error) {
    console.error("FETCH USER ERROR:", error);
    return Response.json({ message: "Failed to fetch user" }, { status: 500 });
  }
}
