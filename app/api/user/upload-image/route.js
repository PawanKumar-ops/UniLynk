import { auth } from "@/auth";
import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import { syncUserClubProfile } from "@/lib/clubProfileSync";

export async function POST(req) {
  try {
    await connectDB();

    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let imageUrl = "";
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const { image, folder } = await req.json();
      if (!image) {
        return NextResponse.json({ error: "No image provided" }, { status: 400 });
      }
      const uploadResult = await cloudinary.uploader.upload(image, {
        folder: folder || "profile-images",
      });
      imageUrl = uploadResult.secure_url;
    } else {
      const formData = await req.formData();
      const file = formData.get("file");

      if (!file) {
        return NextResponse.json({ error: "No file" }, { status: 400 });
      }

      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "profile-images" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      imageUrl = uploadResult.secure_url;
    }

    return NextResponse.json({ url: imageUrl });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
