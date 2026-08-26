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
    let targetFolder = "profile-images";
    let updateField = null;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const { image, folder, type } = await req.json();
      if (!image) {
        return NextResponse.json({ error: "No image provided" }, { status: 400 });
      }

      if (type === "banner" || folder === "profile-banners") {
        targetFolder = "profile-banners";
        updateField = "banner";
      } else if (type === "avatar" || folder === "profile-avatars") {
        targetFolder = "profile-avatars";
        updateField = "img";
      } else {
        targetFolder = folder || "profile-images";
      }

      const uploadResult = await cloudinary.uploader.upload(image, {
        folder: targetFolder,
      });
      imageUrl = uploadResult.secure_url;
    } else {
      const formData = await req.formData();
      const file = formData.get("file");
      const type = formData.get("type");
      const folder = formData.get("folder");

      if (!file) {
        return NextResponse.json({ error: "No file" }, { status: 400 });
      }

      if (type === "banner" || folder === "profile-banners") {
        targetFolder = "profile-banners";
        updateField = "banner";
      } else if (type === "avatar" || folder === "profile-avatars") {
        targetFolder = "profile-avatars";
        updateField = "img";
      } else {
        targetFolder = folder || "profile-images";
      }

      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: targetFolder },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      imageUrl = uploadResult.secure_url;
    }

    if (updateField) {
      const user = await User.findOneAndUpdate(
        { email: session.user.email },
        { [updateField]: imageUrl },
        { new: true }
      );

      if (user) {
        await syncUserClubProfile(user);
      }
    }

    return NextResponse.json({ url: imageUrl });

  } catch (error) {
    console.error("UPLOAD IMAGE ERROR:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
