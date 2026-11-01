import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  // Fall back to CLOUDINARY_URL (which the SDK also reads) when separate vars aren't set.
  ...(process.env.CLOUDINARY_CLOUD_NAME ? { cloud_name: process.env.CLOUDINARY_CLOUD_NAME } : {}),
  ...(process.env.CLOUDINARY_API_KEY ? { api_key: process.env.CLOUDINARY_API_KEY } : {}),
  ...(process.env.CLOUDINARY_API_SECRET ? { api_secret: process.env.CLOUDINARY_API_SECRET } : {}),
});

/** True for raw files uploaded to this app's own Cloudinary account. */
export function isOwnRawFileUrl(url) {
  try {
    const parsed = new URL(String(url).trim());
    const cloud = cloudinary.config().cloud_name;
    return parsed.protocol === "https:" && parsed.hostname === "res.cloudinary.com"
      && Boolean(cloud) && parsed.pathname.startsWith(`/${cloud}/raw/upload/`);
  } catch {
    return false;
  }
}

export default cloudinary;
