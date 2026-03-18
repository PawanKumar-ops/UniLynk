import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import ChatMessage from "@/models/chatMessage";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ email: session.user.email }, { _id: 1 }).lean();
    if (!currentUser?._id) {
      return Response.json({ error: "Current user not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const rawLimit = Number.parseInt(searchParams.get("limit") || "5", 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 8) : 5;
    const currentUserId = new mongoose.Types.ObjectId(currentUser._id);

    const contacts = await ChatMessage.aggregate([
      {
        $match: {
          $or: [{ sender: currentUserId }, { receiver: currentUserId }],
          deletedFor: { $ne: currentUserId },
        },
      },
      {
        $project: {
          otherUserId: {
            $cond: [{ $eq: ["$sender", currentUserId] }, "$receiver", "$sender"],
          },
          createdAt: 1,
        },
      },
      {
        $group: {
          _id: "$otherUserId",
          interactionCount: { $sum: 1 },
          latestMessageAt: { $max: "$createdAt" },
        },
      },
      {
        $sort: {
          interactionCount: -1,
          latestMessageAt: -1,
        },
      },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          id: { $toString: "$user._id" },
          name: { $ifNull: ["$user.name", ""] },
          email: { $ifNull: ["$user.email", ""] },
          image: { $ifNull: ["$user.img", null] },
          interactionCount: 1,
          latestMessageAt: 1,
        },
      },
    ]);

    return Response.json({ contacts });
  } catch (error) {
    console.error("TOP CONTACTS ERROR:", error);
    return Response.json({ error: "Failed to load top contacts" }, { status: 500 });
  }
}
