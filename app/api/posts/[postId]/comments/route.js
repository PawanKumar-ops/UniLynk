import { connectDB } from "@/lib/mongodb";
import Post from "@/models/post";
import Comment from "@/models/comment";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const normalizeEmail = (email) => {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
};

const normalizeImage = (image) => {
  if (typeof image !== "string") return "";

  const cleaned = image.trim();
  if (!cleaned) return "";

  const lowered = cleaned.toLowerCase();
  if (lowered === "null" || lowered === "undefined") return "";

  return cleaned;
};

const buildAvatarFallback = (name) => {
  const safeName = typeof name === "string" && name.trim() ? name.trim() : "UniLynk User";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=random&color=fff&size=128&bold=true`;
};

const normalizeCommentForClient = (comment) => ({
  ...comment,
  id: comment.id ?? comment._id?.toString?.() ?? String(comment._id || ""),
});

const normalizePostForClient = (post, comments = []) => ({
  ...post,
  id: post.id ?? post._id?.toString?.() ?? String(post._id || ""),
  comments: comments.map(normalizeCommentForClient),
  commentCount: Number(post.commentCount ?? comments.length ?? 0),
});

export async function POST(req, { params }) {
  try {
    await connectDB();

    const { postId } = await params;
    if (!postId) {
      return Response.json({ error: "Post id is required" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const sessionEmail = normalizeEmail(session?.user?.email);

    if (!sessionEmail) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, images = [] } = await req.json();
    const safeContent = typeof content === "string" ? content.trim() : "";
    const safeImages = Array.isArray(images)
      ? images
          .filter((image) => typeof image === "string" && image.trim())
          .map((image) => image.trim())
          .slice(0, 4)
      : [];

    if (!safeContent && safeImages.length === 0) {
      return Response.json({ error: "Comment content or image is required" }, { status: 400 });
    }

    const dbUser = await User.findOne({ email: sessionEmail }, { img: 1, name: 1 }).lean();
    const safeAuthorName = dbUser?.name?.trim() || session?.user?.name?.trim() || "UniLynk User";
    const safeAuthorImage = normalizeImage(dbUser?.img) || normalizeImage(session?.user?.image) || buildAvatarFallback(safeAuthorName);

    const existingPost = await Post.findById(postId, { _id: 1 }).lean();
    if (!existingPost) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    const comment = await Comment.create({
      postId,
      content: safeContent,
      images: safeImages,
      authorName: safeAuthorName,
      authorEmail: sessionEmail,
      authorImage: safeAuthorImage,
    });

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $inc: { commentCount: 1 } },
      { new: true }
    ).lean();

    try {
      const { updatePostTrendingScore } = await import("@/lib/feedRanking");
      updatePostTrendingScore(postId).catch(err =>
        console.error(`Error updating trending score for post ${postId} on comment:`, err)
      );
    } catch (err) {
      console.error("Failed to import/run trending score updates for comment:", err);
    }

    return Response.json({ post: normalizePostForClient(updatedPost, [comment.toObject()]) }, { status: 201 });
  } catch (error) {
    console.error("CREATE COMMENT ERROR:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
