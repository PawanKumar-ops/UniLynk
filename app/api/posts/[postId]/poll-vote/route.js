import { connectDB } from "@/lib/mongodb";
import Post from "@/models/post";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const normalizeEmail = (email) => (typeof email === "string" ? email.trim().toLowerCase() : "");

export async function POST(req, { params }) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    const voterEmail = normalizeEmail(session?.user?.email);
    if (!voterEmail) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { optionIndex } = await req.json();
    const safeOptionIndex = Number(optionIndex);
    if (!Number.isInteger(safeOptionIndex) || safeOptionIndex < 0) {
      return Response.json({ error: "Invalid option" }, { status: 400 });
    }

    const post = await Post.findById(params.postId);
    if (!post) return Response.json({ error: "Post not found" }, { status: 404 });
    if (!post.poll || !Array.isArray(post.poll.options) || post.poll.options.length < 2) {
      return Response.json({ error: "No poll found" }, { status: 400 });
    }
    if (safeOptionIndex >= post.poll.options.length) {
      return Response.json({ error: "Option does not exist" }, { status: 400 });
    }

    const hasVoted = post.poll.votes.some((vote) => normalizeEmail(vote.voterEmail) === voterEmail);
    if (hasVoted) {
      return Response.json({ error: "You already voted in this poll" }, { status: 409 });
    }

    post.poll.votes.push({ voterEmail, optionIndex: safeOptionIndex });
    post.poll.options[safeOptionIndex].voteCount = Number(post.poll.options[safeOptionIndex].voteCount || 0) + 1;

    await post.save();

    return Response.json({
      poll: post.poll,
      postId: post._id.toString(),
    });
  } catch (error) {
    console.error("POLL VOTE ERROR:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
