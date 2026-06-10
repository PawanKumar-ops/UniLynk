import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

const ALLOWED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const MAX_MEDIA_SIZE = 25 * 1024 * 1024;

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    if (!ALLOWED_MEDIA_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Unsupported file type: ${file.type || file.name}` }, { status: 400 });
    }

    if (file.size > MAX_MEDIA_SIZE) {
      return NextResponse.json({ error: "Media is too large. Max size is 25MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "post-media", resource_type: "auto" }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        })
        .end(buffer);
    });

    return NextResponse.json({ url: uploadResult.secure_url, mimeType: file.type });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
