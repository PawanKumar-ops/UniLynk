import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Post from "@/models/post";
import User from "@/models/user";
import { profileAvatar } from "@/lib/avatar";

const normalizeImage = (image) => {
  if (typeof image !== "string") return "";
  const value = image.trim();
  return value && value !== "/Profilepic.png" ? value : "";
};

const hydratePostAuthors = (posts, usersByEmail) => posts.map((post) => {
  const email = typeof post.authorEmail === "string" ? post.authorEmail.trim().toLowerCase() : "";
  const author = usersByEmail.get(email);

  return {
    ...post,
    authorId: author?._id?.toString?.() || post.authorId || "",
    authorEmail: email,
    authorName: author?.name?.trim() || post.authorName,
    authorImage: normalizeImage(author?.img) || profileAvatar(null, email),
  };
});

export async function GET(req) {
  try {
    await connectDB();

    const session = await auth();

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

    const allPosts = [...posts, ...savedPosts];
    const authorEmails = [...new Set(
      allPosts
        .map((post) => typeof post.authorEmail === "string" ? post.authorEmail.trim().toLowerCase() : "")
        .filter(Boolean)
    )];
    const authors = await User.find(
      { email: { $in: authorEmails } },
      { email: 1, name: 1, img: 1 }
    ).lean();
    const usersByEmail = new Map(
      authors.map((author) => [author.email.trim().toLowerCase(), author])
    );

    const hydratedPosts = hydratePostAuthors(posts, usersByEmail);
    const hydratedSavedPosts = hydratePostAuthors(savedPosts, usersByEmail);

    return Response.json({
      posts: hydratedPosts,
      savedPosts: hydratedSavedPosts,
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}