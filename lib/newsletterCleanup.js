import cloudinary from "@/lib/cloudinary";
import Newsletter from "@/models/Newsletter";

export const NEWSLETTER_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CLEANUP_BATCH = 5;

const normalizeImage = (image) => {
  if (typeof image !== "string") return "";
  const cleaned = image.trim();
  if (!cleaned) return "";
  const lowered = cleaned.toLowerCase();
  if (lowered === "null" || lowered === "undefined") return "";
  return cleaned;
};

const extractCloudinaryPublicId = (url) => {
  if (typeof url !== "string" || !url.includes("/upload/")) return "";

  try {
    const pathname = new URL(url).pathname;
    const uploadPath = pathname.split("/upload/")[1] || "";
    const withoutVersion = uploadPath.replace(/^v\d+\//, "");
    return withoutVersion.replace(/\.[^/.]+$/, "");
  } catch {
    const uploadPath = url.split("/upload/")[1] || "";
    const withoutVersion = uploadPath.replace(/^v\d+\//, "");
    return withoutVersion.replace(/\.[^/.?#]+([?#].*)?$/, "");
  }
};

const deleteCloudinaryImage = async (newsletter) => {
  const publicId =
    normalizeImage(newsletter?.coverPublicId) ||
    extractCloudinaryPublicId(newsletter?.coverImage);

  if (!publicId) return { status: "skipped" };

  await cloudinary.uploader.destroy(publicId, { invalidate: true });
  return { status: "deleted", publicId };
};

export const cleanupExpiredNewsletters = async (now = new Date()) => {
  const expiredNewsletters = await Newsletter.find(
    { expiresAt: { $lte: now } },
    { _id: 1, coverImage: 1, coverPublicId: 1, expiresAt: 1 }
  )
    .sort({ expiresAt: 1 })
    .limit(MAX_CLEANUP_BATCH)
    .lean();

  if (!expiredNewsletters.length) {
    return { checkedAt: now, deletedCount: 0, cloudinaryDeletedCount: 0 };
  }

  const cloudinaryResults = await Promise.allSettled(
    expiredNewsletters.map(deleteCloudinaryImage)
  );

  const removableIds = expiredNewsletters
    .filter((_, index) => cloudinaryResults[index].status === "fulfilled")
    .map((newsletter) => newsletter._id);

  if (!removableIds.length) {
    return { checkedAt: now, deletedCount: 0, cloudinaryDeletedCount: 0 };
  }

  const deleteResult = await Newsletter.deleteMany({ _id: { $in: removableIds } });

  return {
    checkedAt: now,
    deletedCount: deleteResult.deletedCount || 0,
    cloudinaryDeletedCount: removableIds.length,
  };
};
