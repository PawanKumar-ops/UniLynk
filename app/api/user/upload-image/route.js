import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import cloudinary from "@/lib/cloudinary";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadResult = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: "unilynk/profile",
        transformation: [
          { width: 400, height: 400, crop: "fill", gravity: "face" },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        resolve(result);
      }
    ).end(buffer);
  });

  await connectDB();
  await User.findOneAndUpdate(
    { email: session.user.email },
    { img: uploadResult.secure_url }
  );

 return NextResponse.json({ img: uploadResult.secure_url });
}
