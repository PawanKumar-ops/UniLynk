import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Post from "@/models/post";
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

const normalizePostForClient = (post) => ({
  ...post,
  id: post.id ?? post._id?.toString?.() ?? String(post._id || ""),
  comments: Array.isArray(post.comments) ? post.comments.map(normalizeCommentForClient) : [],
  commentCount: Array.isArray(post.comments) ? post.comments.length : 0,
});

export async function POST(req, { params }) {
  try {
    await connectDB();

    const { postId } = params;
    if (!postId) {
      return Response.json({ error: "Post id is required" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return Response.json({ error: "Invalid post id" }, { status: 400 });
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

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        $push: {
          comments: {
            content: safeContent,
            images: safeImages,
            authorName: safeAuthorName,
            authorEmail: sessionEmail,
            authorImage: safeAuthorImage,
          },
        },
      },
      { new: true }
    ).lean();

    if (!updatedPost) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    return Response.json({ post: normalizePostForClient(updatedPost) }, { status: 201 });
  } catch (error) {
    console.error("CREATE COMMENT ERROR:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
