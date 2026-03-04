import { connectDB } from "@/lib/mongodb";
import Post from "@/models/post";
import User from "@/models/user";
import PostLike from "@/models/postLike";
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

const buildAvatarFallback = (name) => {
  const safeName = typeof name === "string" && name.trim() ? name.trim() : "UniLynk User";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    safeName
  )}&background=random&color=fff&size=128&bold=true`;
};

const resolvePostAuthorImages = async (posts) => {
  const emails = [...new Set(posts.map((post) => normalizeEmail(post.authorEmail)).filter(Boolean))];
  const namesRaw = [...new Set(posts.map((post) => (typeof post.authorName === "string" ? post.authorName.trim() : "")).filter(Boolean))];

  const users = await User.find(
    {
      $or: [
        ...(emails.length ? [{ email: { $in: emails } }] : []),
        ...(namesRaw.length ? [{ name: { $in: namesRaw } }] : []),
      ],
    },
    { email: 1, name: 1, img: 1 }
  ).lean();

  const userImageByEmail = new Map();
  const userImageByName = new Map();

  for (const user of users) {
    const email = normalizeEmail(user.email);
    const name = normalizeName(user.name);
    const image = normalizeImage(user.img);

    if (email && image) userImageByEmail.set(email, image);
    if (name && image && !userImageByName.has(name)) userImageByName.set(name, image);
  }

  return posts.map((post) => {
    const email = normalizeEmail(post.authorEmail);
    const name = normalizeName(post.authorName);
    const liveUserImage = userImageByEmail.get(email) || userImageByName.get(name);
    const storedImage = normalizeImage(post.authorImage);

    return {
      ...post,
      authorEmail: email,
      authorImage: liveUserImage || storedImage || buildAvatarFallback(post.authorName),
    };
  });
};


const resolveLikeState = async (posts, userId) => {
  if (!posts.length) return [];

  const postIds = posts.map((post) => post._id.toString());
  const likedPostIds = new Set();

  if (userId) {
    const likes = await PostLike.find(
      { postId: { $in: postIds }, userId },
      { postId: 1 }
    ).lean();

    for (const like of likes) {
      likedPostIds.add(like.postId.toString());
    }
  }

  return Promise.all(
    posts.map(async (post) => {
      const postId = post._id.toString();
      const likeCount = await getLikeCount(postId, Number(post.likeCount || 0));

      return {
        ...post,
        likeCount,
        likedByCurrentUser: likedPostIds.has(postId),
      };
    })
  );
};

const normalizePosts = (posts) =>
  posts.map((post) => ({
    ...post,
    id: post.id ?? post._id?.toString?.() ?? String(post._id || ""),
  }));

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const audience = searchParams.get("audience");

    const query =
      audience === "for-you" || audience === "clubs" ? { audience } : {};

    const posts = await Post.find(query).sort({ createdAt: -1 }).lean();
    const hydratedPosts = await resolvePostAuthorImages(posts);

    const session = await getServerSession(authOptions);
    const sessionEmail = normalizeEmail(session?.user?.email);
    const user = sessionEmail
      ? await User.findOne({ email: sessionEmail }, { _id: 1 }).lean()
      : null;

    const enrichedPosts = await resolveLikeState(hydratedPosts, user?._id?.toString());
    const normalizedPosts = normalizePosts(enrichedPosts);

    return Response.json({ posts: normalizedPosts }, { status: 200 });
  } catch (error) {
    console.error("GET POSTS ERROR:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(req) {
  try {
const {
      content,
      audience,
      authorName,
      authorImage,
      authorEmail,
      images = [],
    } = await req.json();

    const safeContent = content?.trim() || "";
    const safeImages = Array.isArray(images)
      ? images
          .filter((image) => typeof image === "string" && image.trim())
          .map((image) => image.trim())
          .slice(0, 4)
      : [];

    if (!safeContent && safeImages.length === 0) {
      return new Response("Post content or image is required", { status: 400 });
    }

    const safeAudience = audience === "clubs" ? "clubs" : "for-you";


    await connectDB();

   const session = await getServerSession(authOptions);
    const sessionEmail = normalizeEmail(session?.user?.email);

    const safeAuthorEmail = normalizeEmail(authorEmail) || sessionEmail;
    const safeAuthorName = authorName?.trim() || session?.user?.name?.trim() || "UniLynk User";

    let safeAuthorImage = normalizeImage(authorImage) || normalizeImage(session?.user?.image);

    if (safeAuthorEmail) {
      const dbUser = await User.findOne({ email: safeAuthorEmail }, { img: 1, name: 1 }).lean();
      safeAuthorImage = normalizeImage(dbUser?.img) || safeAuthorImage;
    }

    safeAuthorImage = safeAuthorImage || buildAvatarFallback(safeAuthorName);

    const post = await Post.create({
      content: safeContent,
      audience: safeAudience,
      authorName: safeAuthorName,
      authorEmail: safeAuthorEmail,
      authorImage: safeAuthorImage,
      images: safeImages,
    });

    const normalizedPost = {
      ...post.toObject(),
      id: post._id.toString(),
    };

    return Response.json({ post: normalizedPost }, { status: 201 });
  } catch (error) {
    console.error("CREATE POST ERROR:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
