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
    const { content, audience, authorName, authorImage, images = [] } = await req.json();

    const safeContent = content?.trim() || "";
    const safeImages = Array.isArray(images)
      ? images.filter((image) => typeof image === "string" && image.trim()).map((image) => image.trim()).slice(0, 4)
      : [];

    if (!safeContent && safeImages.length === 0) {
      return new Response("Post content or image is required", { status: 400 });
    }

    const safeAudience = audience === "clubs" ? "clubs" : "for-you";

    await connectDB();

    const post = await Post.create({
      content: safeContent,
      audience: safeAudience,
      authorName: authorName?.trim() || "UniLynk User",
      authorImage: authorImage?.trim() || "/Profilepic.png",
      images: safeImages,
    });

    return Response.json({ post }, { status: 201 });
  } catch (error) {
    console.error("CREATE POST ERROR:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
