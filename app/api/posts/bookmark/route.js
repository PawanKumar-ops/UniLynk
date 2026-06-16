import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import Post from "@/models/post";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// POST /api/posts/bookmark
// Toggle bookmark status for the authenticated user.
export async function POST(req) {
  try {
    await connectDB();

    // Authenticate user
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate request body
    const { postId } = await req.json();

    if (!postId || typeof postId !== "string") {
      return Response.json(
        { error: "Invalid postId" },
        { status: 400 }
      );
    }

    // Verify post exists
    const post = await Post.findById(postId)
      .select("_id")
      .lean();

    if (!post) {
      return Response.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Get user saved posts
    const user = await User.findOne(
      { email: session.user.email },
      { savedPosts: 1 }
    );

    if (!user) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const alreadySaved =
      user.savedPosts?.some((id) => id.equals(post._id)) ?? false;

    // Update user's saved posts
    const userResult = await User.updateOne(
      { _id: user._id },
      alreadySaved
        ? { $pull: { savedPosts: post._id } }
        : { $addToSet: { savedPosts: post._id } }
    );

    // Only update count if user's bookmarks actually changed
    if (userResult.modifiedCount > 0) {
      await Post.updateOne(
        { _id: post._id },
        {
          $inc: {
            bookmarkCount: alreadySaved ? -1 : 1,
          },
        }
      );

      // Prevent negative bookmark count (optional safety)
      await Post.updateOne(
        {
          _id: post._id,
          bookmarkCount: { $lt: 0 },
        },
        {
          $set: {
            bookmarkCount: 0,
          },
        }
      );
    }

    // Fire-and-forget trending score update
    import("@/lib/feedRanking")
      .then(({ updatePostTrendingScore }) =>
        updatePostTrendingScore(postId)
      )
      .catch((err) =>
        console.error(
          `Error updating trending score for post ${postId}:`,
          err
        )
      );

    return Response.json(
      {
        saved: !alreadySaved,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("BOOKMARK ERROR:", error);

    return Response.json(
      {
        error: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}