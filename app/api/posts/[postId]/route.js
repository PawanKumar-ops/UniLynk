import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import { getLikeCount } from "@/lib/postLikeCache";
import Post from "@/models/post";
import PostLike from "@/models/postLike";
import User from "@/models/user";
import { getServerSession } from "next-auth";

const normalizeEmail = (email) => {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
};

const normalizeName = (name) => {
  if (typeof name !== "string") return "";
  return name.trim().toLowerCase();
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    safeName,
  )}&background=random&color=fff&size=128&bold=true`;
};

const resolvePostAuthorImage = async (post) => {
  const email = normalizeEmail(post.authorEmail);
  const name = normalizeName(post.authorName);
  const authorName = typeof post.authorName === "string" ? post.authorName.trim() : "";
  const authorQueries = [
    ...(email ? [{ email }] : []),
    ...(name && authorName ? [{ name: new RegExp(`^${escapeRegex(authorName)}$`, "i") }] : []),
  ];
  const user = authorQueries.length
    ? await User.findOne({ $or: authorQueries }, { img: 1 }).lean()
    : null;
  const storedImage = normalizeImage(post.authorImage);

  return {
    ...post,
    authorEmail: email,
    authorImage: normalizeImage(user?.img) || storedImage || buildAvatarFallback(post.authorName),
  };
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

const normalizePostForClient = (post, userId = null) => ({
  ...post,
  id: post.id ?? post._id?.toString?.() ?? String(post._id || ""),
  comments: Array.isArray(post.comments)
    ? post.comments.map((comment) => ({
        ...comment,
        id: comment.id ?? comment._id?.toString?.() ?? String(comment._id || ""),
      }))
    : [],
  commentCount: Array.isArray(post.comments) ? post.comments.length : 0,
  poll: normalizePollForUser(post.poll, userId),
});

export async function GET(req, { params }) {
  try {
    await connectDB();

    const { postId } = await params;
    if (!postId) {
      return Response.json({ error: "Post id is required" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const sessionEmail = normalizeEmail(session?.user?.email);
    const user = sessionEmail
      ? await User.findOne({ email: sessionEmail }, { _id: 1, savedPosts: 1 }).lean()
      : null;

    const post = await Post.findById(postId).lean();
    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    const hydratedPost = await resolvePostAuthorImage(post);
    const postIdString = hydratedPost._id.toString();
    const [likeCount, like, savedByCurrentUser] = await Promise.all([
      getLikeCount(postIdString, Number(hydratedPost.likeCount || 0)),
      user?._id
        ? PostLike.findOne({ postId: postIdString, userId: user._id.toString() }, { _id: 1 }).lean()
        : null,
      Promise.resolve(
        Boolean(user?.savedPosts?.some((savedPostId) => savedPostId.toString() === postIdString)),
      ),
    ]);

    return Response.json(
      {
        post: normalizePostForClient(
          {
            ...hydratedPost,
            likeCount,
            likedByCurrentUser: Boolean(like),
            savedByCurrentUser,
          },
          user?._id?.toString(),
        ),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET POST ERROR:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
