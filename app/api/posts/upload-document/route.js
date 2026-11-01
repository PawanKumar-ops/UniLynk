import { NextResponse } from "next/server";
import { auth } from "@/auth";
import cloudinary from "@/lib/cloudinary";
import { DOCUMENT_TYPES, MAX_DOCUMENT_BYTES, documentExtension } from "@/lib/documents";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const ext = documentExtension(file.name);
    if (!DOCUMENT_TYPES[ext]) {
      return NextResponse.json({ error: "Only PDF, Word, Excel, PowerPoint, CSV and text files are supported." }, { status: 400 });
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      return NextResponse.json({ error: "Documents can be at most 10 MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const baseName = file.name.replace(/\.[^.]+$/, "");
    const slug = baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "document";

    // "raw" stores the file byte-for-byte. Uploading documents as images is why
    // PDFs/Word files previously failed to open (Cloudinary blocks PDF delivery
    // for image uploads by default, and Office files aren't images at all).
    // Raw public ids must include the extension so the URL keeps it.
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "raw", folder: "post-documents", public_id: `${slug}-${Date.now()}.${ext}`, overwrite: false },
          (error, uploaded) => (error ? reject(error) : resolve(uploaded)),
        )
        .end(buffer);
    });

    return NextResponse.json({
      document: {
        url: result.secure_url,
        name: file.name.slice(0, 200),
        size: file.size,
        ext,
        mimeType: DOCUMENT_TYPES[ext].mime,
      },
    });
  } catch (error) {
    console.error("DOCUMENT UPLOAD ERROR:", error);
    return NextResponse.json({ error: "Document upload failed" }, { status: 500 });
  }
}
