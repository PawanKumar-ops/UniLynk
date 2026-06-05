import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId, action } = await req.json();
    if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
      return Response.json({ error: "Valid targetUserId is required" }, { status: 400 });
    }

    if (action !== "block" && action !== "unblock") {
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    await connectDB();
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return Response.json({ error: "Current user not found" }, { status: 404 });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return Response.json({ error: "Target user not found" }, { status: 404 });
    }

    if (action === "block") {
      if (!currentUser.blockedUsers) {
        currentUser.blockedUsers = [];
      }
      const targetObjId = new mongoose.Types.ObjectId(targetUserId);
      const isAlreadyBlocked = currentUser.blockedUsers.some(
        (id) => id.toString() === targetUserId
      );
      if (!isAlreadyBlocked) {
        currentUser.blockedUsers.push(targetObjId);
        await currentUser.save();
      }
    } else if (action === "unblock") {
      if (currentUser.blockedUsers) {
        currentUser.blockedUsers = currentUser.blockedUsers.filter(
          (id) => id.toString() !== targetUserId
        );
        await currentUser.save();
      }
    }

    return Response.json({
      ok: true,
      blockedUsers: (currentUser.blockedUsers || []).map((id) => id.toString()),
    });
  } catch (error) {
    console.error("BLOCK/UNBLOCK ERROR:", error);
    return Response.json({ error: "Failed to perform block action" }, { status: 500 });
  }
}
