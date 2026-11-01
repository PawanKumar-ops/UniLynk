import { DOCUMENT_TYPES, documentExtension } from "@/lib/documents";
import cloudinary, { isOwnRawFileUrl } from "@/lib/cloudinary";


// ".../raw/upload/v123/post-documents/file.pdf" -> "post-documents/file.pdf"
function rawPublicId(url) {
  const path = new URL(url).pathname.split("/raw/upload/")[1] || "";
  return decodeURIComponent(path.replace(/^v\d+\//, ""));
}

/**
 * Public delivery can be refused (Cloudinary blocks PDF delivery on many
 * accounts by default), so fall back to an API-signed download, which uses the
 * account credentials and is not affected by that setting.
 */
async function fetchDocument(url) {
  const direct = await fetch(url).catch(() => null);
  if (direct?.ok && direct.body) return direct;

  try {
    const signedUrl = cloudinary.utils.private_download_url(rawPublicId(url), "", {
      resource_type: "raw",
      type: "upload",
      expires_at: Math.floor(Date.now() / 1000) + 300,
    });
    const signed = await fetch(signedUrl);
    if (signed.ok && signed.body) return signed;
    console.error("DOCUMENT OPEN ERROR:", direct?.status, signed.status, await signed.text().catch(() => ""));
  } catch (error) {
    console.error("DOCUMENT OPEN ERROR:", error);
  }
  return null;
}

const safeFileName = (name) => String(name || "document").replace(/[\r\n"\\]/g, "").slice(0, 200) || "document";

/**
 * Streams a post document with the correct Content-Type so browsers display
 * PDFs/text inline (or download when ?download=1), whatever Cloudinary sends.
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url") || "";
  const name = safeFileName(searchParams.get("name"));
  const download = searchParams.get("download") === "1";

  if (!isOwnRawFileUrl(url)) {
    return Response.json({ error: "Invalid document" }, { status: 400 });
  }

  const upstream = await fetchDocument(url);
  if (!upstream) {
    return Response.json({ error: "Document not found" }, { status: 404 });
  }

  const ext = documentExtension(name) || documentExtension(new URL(url).pathname);
  const type = DOCUMENT_TYPES[ext];
  const headers = new Headers({
    "Content-Type": type?.mime || "application/octet-stream",
    "Content-Disposition": `${download || !type || type.viewer !== "inline" ? "attachment" : "inline"}; filename="${name}"; filename*=UTF-8''${encodeURIComponent(name)}`,
    "Cache-Control": "public, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  });
  const length = upstream.headers.get("content-length");
  if (length) headers.set("Content-Length", length);

  return new Response(upstream.body, { status: 200, headers });
}
