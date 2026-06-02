import { connectDB } from "@/lib/mongodb";
import Post from "@/models/post";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOne({
      email: session.user.email,
    }).lean();

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // USER POSTS
    const posts = await Post.find({
      authorEmail: session.user.email,
    })
      .sort({ createdAt: -1 })
      .lean();

    // SAVED POSTS
    const savedPosts = await Post.find({
      _id: { $in: user.savedPosts || [] },
    })
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({
      posts,
      savedPosts,
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}