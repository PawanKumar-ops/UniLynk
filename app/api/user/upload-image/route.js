import { auth } from "@/auth";
import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_DATA_URL_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const getUploadOptions = (type) => ({
  folder: type === "banner" ? "profile-banners" : "profile-avatars",
  resource_type: "image",
  allowed_formats: ["jpg", "jpeg", "png", "webp"],
  transformation: [
    {
      width: type === "banner" ? 1500 : 800,
      height: type === "banner" ? 500 : 800,
      crop: "limit",
      quality: "auto",
      fetch_format: "auto",
    },
  ],
});

const getDataUrlMimeType = (image) => image.match(/^data:(image\/[a-z0-9.+-]+);base64,/i)?.[1]?.toLowerCase();

const isDataUrlWithinSizeLimit = (image) => {
  const base64 = image.split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4) <= MAX_IMAGE_SIZE_BYTES;
};

export async function POST(req) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let imageUrl = "";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const { image, type } = await req.json();
      const mimeType = typeof image === "string" ? getDataUrlMimeType(image) : null;
      if (!image || !mimeType || !ALLOWED_DATA_URL_TYPES.has(mimeType)) {
        return NextResponse.json({ error: "Upload a JPG, PNG, or WebP image." }, { status: 400 });
      }
      if (!isDataUrlWithinSizeLimit(image)) {
        return NextResponse.json({ error: "Image must be 10 MB or smaller." }, { status: 413 });
      }
      if (type !== "banner" && type !== "avatar") {
        return NextResponse.json({ error: "Invalid image type." }, { status: 400 });
      }
      if (!image) {
        return NextResponse.json({ error: "No image provided" }, { status: 400 });
      }

      const uploadResult = await cloudinary.uploader.upload(image, getUploadOptions(type));
      imageUrl = uploadResult.secure_url;
    } else {
      const formData = await req.formData();
      const file = formData.get("file");
      const type = formData.get("type");

      if (!file || typeof file.arrayBuffer !== "function") {
        return NextResponse.json({ error: "No file" }, { status: 400 });
      }
      if (type !== "banner" && type !== "avatar") {
        return NextResponse.json({ error: "Invalid image type." }, { status: 400 });
      }
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return NextResponse.json({ error: "Upload a JPG, PNG, or WebP image." }, { status: 400 });
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json({ error: "Image must be 10 MB or smaller." }, { status: 413 });
      }

      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          getUploadOptions(type),
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      imageUrl = uploadResult.secure_url;
    }

    // This only stages the image. The profile PATCH request persists the URL together
    // with the rest of the profile, so cancelling the edit screen never changes a user.
    return NextResponse.json({ url: imageUrl }, { headers: { "Cache-Control": "no-store" } });

  } catch (error) {
    console.error("UPLOAD IMAGE ERROR:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
