import mongoose from "mongoose";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import { enforceUserRateLimit } from "@/lib/rateLimit";
import Post from "@/models/post";
import User from "@/models/user";

const resolveCurrentUser = async () => {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) return null;

  return User.findOne({ email }, { _id: 1 }).lean();
};

const normalizePostId = async (context) => {
  const params = await context?.params;
  const postId = params?.postId;

  if (!postId || typeof postId !== "string") return "";
  return postId.trim();
};

const normalizePoll = (poll, userId) => {
  if (!poll || !Array.isArray(poll.options)) return null;

  const userIdString = userId?.toString?.() || String(userId || "");
  const votedOptionId = poll.votes?.find(
    (vote) => vote.userId?.toString?.() === userIdString
  )?.optionId || null;

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

export async function POST(req, context) {
  try {
    await connectDB();

    const user = await resolveCurrentUser();
    if (!user?._id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const postId = await normalizePostId(context);
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return Response.json({ error: "Invalid post id" }, { status: 400 });
    }

    const { optionId } = await req.json();
    const safeOptionId = typeof optionId === "string" ? optionId.trim() : "";
    if (!safeOptionId) {
      return Response.json({ error: "Poll option is required" }, { status: 400 });
    }

    const limiter = enforceUserRateLimit({ key: `poll-vote:${user._id}` });
    if (!limiter.allowed) {
      return Response.json(
        { error: "Rate limit exceeded", retryAfterMs: limiter.retryAfterMs },
        { status: 429 }
      );
    }

    const now = new Date();
    const updatedPost = await Post.findOneAndUpdate(
      {
        _id: postId,
        "poll.endsAt": { $gt: now },
        "poll.options.id": safeOptionId,
        "poll.votes.userId": { $ne: user._id },
      },
      {
        $inc: {
          "poll.options.$.votes": 1,
          "poll.totalVotes": 1,
        },
        $push: {
          "poll.votes": {
            userId: user._id,
            optionId: safeOptionId,
            votedAt: now,
          },
        },
      },
      { new: true, projection: { poll: 1 } }
    ).lean();

    if (updatedPost?.poll) {
      try {
        const { updatePostTrendingScore } = await import("@/lib/feedRanking");
        updatePostTrendingScore(postId).catch(err =>
          console.error(`Error updating trending score for post ${postId} on poll vote:`, err)
        );
      } catch (err) {
        console.error("Failed to import/run trending score updates for poll vote:", err);
      }
      return Response.json({ poll: normalizePoll(updatedPost.poll, user._id) }, { status: 200 });
    }

    const currentPost = await Post.findById(postId, { poll: 1 }).lean();
    if (!currentPost?.poll) {
      return Response.json({ error: "Poll not found" }, { status: 404 });
    }

    const currentPoll = normalizePoll(currentPost.poll, user._id);
    const hasOption = currentPoll.options.some((option) => option.id === safeOptionId);
    if (!hasOption) {
      return Response.json({ error: "Poll option not found", poll: currentPoll }, { status: 404 });
    }

    const isExpired = new Date(currentPoll.endsAt).getTime() <= Date.now();
    if (isExpired) {
      return Response.json({ error: "Poll has ended", poll: currentPoll }, { status: 409 });
    }

    return Response.json({ error: "You have already voted", poll: currentPoll }, { status: 409 });
  } catch (error) {
    console.error("POLL VOTE ERROR:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
