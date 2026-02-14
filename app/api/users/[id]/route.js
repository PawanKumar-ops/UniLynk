import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export async function GET(_req, { params }) {
  try {
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid user id" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(id).select("-password").lean();

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ user }, { status: 200 });
  } catch (error) {
    console.error("GET USER ERROR:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
