import { connectDB } from "@/lib/mongodb";
import Post from "@/models/post";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const audience = searchParams.get("audience");

    const query =
      audience === "for-you" || audience === "clubs" ? { audience } : {};

    const posts = await Post.find(query).sort({ createdAt: -1 }).lean();

    return Response.json({ posts }, { status: 200 });
  } catch (error) {
    console.error("GET POSTS ERROR:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { content, audience, authorName } = await req.json();

    if (!content || !content.trim()) {
      return new Response("Post content is required", { status: 400 });
    }

    const safeAudience = audience === "clubs" ? "clubs" : "for-you";

    await connectDB();

    const post = await Post.create({
      content: content.trim(),
      audience: safeAudience,
      authorName: authorName?.trim() || "UniLynk User",
    });

    return Response.json({ post }, { status: 201 });
  } catch (error) {
    console.error("CREATE POST ERROR:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
