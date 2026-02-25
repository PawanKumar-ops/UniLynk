import path from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import cloudinary from "@/lib/cloudinary";

const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "application/zip",
  "application/x-rar-compressed",
  "application/vnd.rar",
];

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const MAX_DOCUMENT_SIZE = 15 * 1024 * 1024;
const MAX_MEDIA_SIZE = 25 * 1024 * 1024;

function getFileKind(file) {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) return "image";
  if (ALLOWED_VIDEO_TYPES.includes(file.type)) return "video";
  if (ALLOWED_DOCUMENT_TYPES.includes(file.type)) return "document";
  return null;
}

function getPublicId(fileName = "") {
  const parsed = path.parse(fileName);
  return parsed.name || `chat-file-${Date.now()}`;
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

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
        return NextResponse.json({ error: `Unsupported file type: ${file.type || file.name}` }, { status: 400 });
      }

      const maxSize = fileKind === "document" ? MAX_DOCUMENT_SIZE : MAX_MEDIA_SIZE;
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `${file.name} is too large. Max size is ${fileKind === "document" ? "15MB" : "25MB"}.` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: fileKind === "document" ? "chat-documents" : "chat-media",
              resource_type: fileKind === "document" ? "raw" : "auto",
              use_filename: true,
              unique_filename: true,
              filename_override: getPublicId(file.name),
            },
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
        mimeType: file.type,
        size: file.size,
      });
    }

    return NextResponse.json({ files: uploadedFiles, file: uploadedFiles[0] });
  } catch (error) {
    console.error("CHAT FILE UPLOAD ERROR:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
