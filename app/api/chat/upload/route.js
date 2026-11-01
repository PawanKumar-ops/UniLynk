import { auth } from "@/auth";
import path from "path";
import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { DOCUMENT_TYPES, documentExtension } from "@/lib/documents";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

// Cloudinary's raw upload limit on the free plan.
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
const MAX_MEDIA_SIZE = 25 * 1024 * 1024;

function getFileKind(file) {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) return "image";
  if (ALLOWED_VIDEO_TYPES.includes(file.type)) return "video";
  // Match documents by extension: browsers often send an empty or generic type for Office files.
  if (DOCUMENT_TYPES[documentExtension(file.name)]) return "document";
  return null;
}

function getPublicId(fileName = "") {
  const parsed = path.parse(fileName);
  return parsed.name || `chat-file-${Date.now()}`;
}

export async function POST(req) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files");

    if (!files.length) {
      const singleFile = formData.get("file");
      if (singleFile) files.push(singleFile);
    }

    if (!files.length) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (files.length > 10) {
      return NextResponse.json({ error: "You can upload up to 10 files at once." }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      const fileKind = getFileKind(file);

      if (!fileKind) {
        return NextResponse.json({ error: `Unsupported file: ${file.name}. Send a photo, video, or a PDF, Word, Excel, PowerPoint, CSV or text file.` }, { status: 400 });
      }

      const maxSize = fileKind === "document" ? MAX_DOCUMENT_SIZE : MAX_MEDIA_SIZE;
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `${file.name} is too large. Max size is ${fileKind === "document" ? "10MB" : "25MB"}.` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = documentExtension(file.name);
      const slug = getPublicId(file.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "document";
      // Raw files keep their extension in the public id so the URL (and viewers) know the type.
      const uploadOptions = fileKind === "document"
        ? { folder: "chat-documents", resource_type: "raw", public_id: `${slug}-${Date.now()}.${ext}`, overwrite: false }
        : { folder: "chat-media", resource_type: "auto", use_filename: true, unique_filename: true, filename_override: getPublicId(file.name) };

      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            uploadOptions,
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(buffer);
      });

      uploadedFiles.push({
        url: uploadResult.secure_url,
        fileName: file.name,
        mimeType: fileKind === "document" ? DOCUMENT_TYPES[ext].mime : file.type,
        size: file.size,
      });
    }

    return NextResponse.json({ files: uploadedFiles, file: uploadedFiles[0] });
  } catch (error) {
    console.error("CHAT FILE UPLOAD ERROR:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
