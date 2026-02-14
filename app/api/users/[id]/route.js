import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export async function GET(req, { params }) {
  try {
    // 1️⃣ Validate ID
    const userId = params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { message: "Invalid user id" },
        { status: 400 }
      );
    }

    // 2️⃣ Connect DB
    await connectDB();

    // 3️⃣ Find user
    const user = await User.findById(userId)
      .select("-password"); // never expose password

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // 4️⃣ Success
    return NextResponse.json({ user }, { status: 200 });

  } catch (error) {
    console.error("GET /api/users/[id] error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
