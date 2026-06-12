import { connectDB } from "@/lib/mongodb";
import Post from "@/models/post";
import Comment from "@/models/comment";
import User from "@/models/user";
import mongoose from "mongoose";
import PostLike from "@/models/postLike";
import cloudinary from "@/lib/cloudinary";
import { getLikeCount } from "@/lib/postLikeCache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const normalizeEmail = (email) => {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
};

const normalizeName = (name) => {
  if (typeof name !== "string") return "";
  return name.trim().toLowerCase();
};

const normalizeImage = (image) => {
  if (typeof image !== "string") return "";

  const cleaned = image.trim();
  if (!cleaned) return "";

  const lowered = cleaned.toLowerCase();
  if (lowered === "null" || lowered === "undefined") return "";

  return cleaned;
};


const extractCloudinaryPublicId = (url) => {
  if (typeof url !== "string" || !url.includes("/upload/")) return "";

  try {
    const pathname = new URL(url).pathname;
    const uploadPath = pathname.split("/upload/")[1] || "";
    const withoutVersion = uploadPath.replace(/^v\d+\//, "");
    return withoutVersion.replace(/\.[^/.]+$/, "");
  } catch {
    const uploadPath = url.split("/upload/")[1] || "";
    const withoutVersion = uploadPath.replace(/^v\d+\//, "");
    return withoutVersion.replace(/\.[^/.?#]+([?#].*)?$/, "");
  }
};

const deletePostMediaFromCloudinary = async (images = []) => {
  const publicIds = [...new Set(
    (Array.isArray(images) ? images : [])
      .map(extractCloudinaryPublicId)
      .filter(Boolean)
  )];

  if (!publicIds.length) return { deletedCount: 0, failedCount: 0 };

  const results = await Promise.allSettled(
    publicIds.map((publicId) =>
      cloudinary.uploader.destroy(publicId, { invalidate: true })
    )
  );

  const failedResults = results.filter((result) => result.status === "rejected");
  if (failedResults.length) {
    console.error(
      "POST MEDIA DELETE ERROR:",
      failedResults.map((result) => result.reason)
    );
  }

  return {
    deletedCount: results.length - failedResults.length,
    failedCount: failedResults.length,
  };
};

const buildAvatarFallback = (name) => {
  const safeName = typeof name === "string" && name.trim() ? name.trim() : "UniLynk User";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    safeName
  )}&background=random&color=fff&size=128&bold=true`;
};

const normalizePollForUser = (poll, userId) => {
  if (!poll || !Array.isArray(poll.options)) return undefined;

  const votedOptionId = userId
    ? poll.votes?.find((vote) => vote.userId?.toString?.() === userId)?.optionId || null
    : null;

  return {
    options: poll.options.map((option) => ({
      id: option.id,
      text: option.text,
      votes: Number(option.votes || 0),
    })),
    totalVotes: Number(poll.totalVotes || 0),
    endsAt: poll.endsAt instanceof Date ? poll.endsAt.toISOString() : poll.endsAt,
    votedOptionId,
  };
};

const normalizeCommentForClient = (comment) => ({
  ...comment,
  id: comment.id ?? comment._id?.toString?.() ?? String(comment._id || ""),
});

const normalizePostForClient = (post, userId = null) => ({
  ...post,
  id: post.id ?? post._id?.toString?.() ?? String(post._id || ""),
  comments: Array.isArray(post.comments) ? post.comments.map(normalizeCommentForClient) : [],
  commentCount: Number(post.commentCount ?? (Array.isArray(post.comments) ? post.comments.length : 0)),
  bookmarkCount: Number(post.bookmarkCount || 0),
  poll: normalizePollForUser(post.poll, userId),
});

const resolvePostAuthorImage = async (post) => {
  const email = normalizeEmail(post.authorEmail);
  const name = typeof post.authorName === "string" ? post.authorName.trim() : "";
  const conditions = [
    ...(email ? [{ email }] : []),
    ...(name ? [{ name }] : []),
  ];

  const user = conditions.length
    ? await User.findOne({ $or: conditions }, { email: 1, name: 1, img: 1 }).lean()
    : null;

  const userImageMatchesEmail = normalizeEmail(user?.email) === email;
  const userImageMatchesName = normalizeName(user?.name) === normalizeName(name);
  const liveUserImage = (userImageMatchesEmail || userImageMatchesName)
    ? normalizeImage(user?.img)
    : "";
  const storedImage = normalizeImage(post.authorImage);

  return {
    ...post,
    authorEmail: email,
    authorImage: liveUserImage || storedImage || buildAvatarFallback(post.authorName),
  };
};

export async function GET(_req, { params }) {
  try {
    await connectDB();

    const { postId } = await params;
    if (!postId) {
      return Response.json({ error: "Post id is required" }, { status: 400 });
    }

    if (!mongoose.isValidObjectId(postId)) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    const post = await Post.findById(postId).lean();
    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    const sessionEmail = normalizeEmail(session?.user?.email);
    const user = sessionEmail
      ? await User.findOne({ email: sessionEmail }, { _id: 1, savedPosts: 1 }).lean()
      : null;
    const userId = user?._id?.toString();
    const hydratedPost = await resolvePostAuthorImage(post);
    const postObjectId = hydratedPost._id.toString();
    const [likeCount, likedPost, comments] = await Promise.all([
      getLikeCount(postObjectId, Number(hydratedPost.likeCount || 0)),
      userId ? PostLike.findOne({ postId: postObjectId, userId }, { _id: 1 }).lean() : null,
      Comment.find({ postId: postObjectId }).sort({ createdAt: 1, _id: 1 }).lean(),
    ]);
    const savedPostIds = new Set(user?.savedPosts?.map((id) => id.toString()) || []);

    return Response.json(
      {
        post: normalizePostForClient(
          {
            ...hydratedPost,
            likeCount,
            likedByCurrentUser: Boolean(likedPost),
            savedByCurrentUser: savedPostIds.has(postObjectId),
            comments,
          },
          userId,
        ),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET POST ERROR:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    await connectDB();

    const { postId } = await params;
    if (!postId) {
      return Response.json({ error: "Post id is required" }, { status: 400 });
    }

    if (!mongoose.isValidObjectId(postId)) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    const sessionEmail = normalizeEmail(session?.user?.email);
    if (!sessionEmail) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await Post.findById(postId, { authorEmail: 1, images: 1 }).lean();
    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    if (normalizeEmail(post.authorEmail) !== sessionEmail) {
      return Response.json({ error: "Only the post author can delete this post" }, { status: 403 });
    }

    const cloudinaryResult = await deletePostMediaFromCloudinary(post.images);

    await Promise.all([
      Comment.deleteMany({ postId }),
      PostLike.deleteMany({ postId }),
      User.updateMany(
        { savedPosts: post._id },
        { $pull: { savedPosts: post._id } }
      ),
    ]);

    await Post.deleteOne({ _id: post._id });

    return Response.json(
      {
        ok: true,
        deletedPostId: post._id.toString(),
        cloudinaryDeletedCount: cloudinaryResult.deletedCount,
        cloudinaryFailedCount: cloudinaryResult.failedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE POST ERROR:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
