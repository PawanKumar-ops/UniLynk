import mongoose from "mongoose";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import { enforceUserRateLimit } from "@/lib/rateLimit";
import { adjustLikeCount, getLikeCount } from "@/lib/postLikeCache";
import { enqueueLikeCountSync } from "@/lib/likeCountQueue";
import Post from "@/models/post";
import PostLike from "@/models/postLike";
import User from "@/models/user";

const resolveCurrentUser = async () => {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) return null;

  return User.findOne({ email }, { _id: 1 }).lean();
};

const invalidPostResponse = () =>
  Response.json({ error: "Invalid post id" }, { status: 400 });

const extractValidPostId = (params) => {
  const postId = params?.postId;

  if (!postId || typeof postId !== "string") {
    return null;
  }

  const normalizedPostId = postId.trim();

  if (!normalizedPostId || normalizedPostId === "undefined") {
    return null;
  }

  return normalizedPostId;
};

export async function POST(_req, { params }) {
  try {
    await connectDB();

    const user = await resolveCurrentUser();
    if (!user?._id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const postId = extractValidPostId(params);
    if (!postId) {
      return invalidPostResponse();
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return invalidPostResponse();
    }

    const limiter = enforceUserRateLimit({ key: `like:${user._id}` });
    if (!limiter.allowed) {
      return Response.json(
        { error: "Rate limit exceeded", retryAfterMs: limiter.retryAfterMs },
        { status: 429 }
      );
    }

    const postDoc = await Post.findById(postId, { likeCount: 1 }).lean();
    if (!postDoc) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    const upsertResult = await PostLike.updateOne(
      { postId, userId: user._id },
      { $setOnInsert: { postId, userId: user._id } },
      { upsert: true }
    );

    const inserted = upsertResult.upsertedCount > 0;
    const likeCount = inserted
      ? await adjustLikeCount(postId, 1, Number(postDoc.likeCount || 0))
      : await getLikeCount(postId, Number(postDoc.likeCount || 0));

    if (inserted) {
      enqueueLikeCountSync(postId, 1);
    }

    return Response.json(
      {
        postId,
        likedByCurrentUser: true,
        likeCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("LIKE POST ERROR:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    await connectDB();

    const user = await resolveCurrentUser();
    if (!user?._id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const postId = extractValidPostId(params);
    if (!postId) {
      return invalidPostResponse();
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return invalidPostResponse();
    }

    const limiter = enforceUserRateLimit({ key: `unlike:${user._id}` });
    if (!limiter.allowed) {
      return Response.json(
        { error: "Rate limit exceeded", retryAfterMs: limiter.retryAfterMs },
        { status: 429 }
      );
    }

    const deleteResult = await PostLike.deleteOne({ postId, userId: user._id });

    const removed = deleteResult.deletedCount > 0;
    const postDoc = await Post.findById(postId, { likeCount: 1 }).lean();
    if (!postDoc) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    const likeCount = removed
      ? await adjustLikeCount(postId, -1, Number(postDoc.likeCount || 0))
      : await getLikeCount(postId, Number(postDoc.likeCount || 0));

    if (removed) {
      enqueueLikeCountSync(postId, -1);
    }

    return Response.json(
      {
        postId,
        likedByCurrentUser: false,
        likeCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("UNLIKE POST ERROR:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
