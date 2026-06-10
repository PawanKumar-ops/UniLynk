import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import cloudinary from "@/lib/cloudinary";
import { connectDB } from "@/lib/mongodb";
import Club from "@/models/Club";
import Newsletter from "@/models/Newsletter";

const MAX_DESCRIPTION_LENGTH = 120;
const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CLEANUP_BATCH = 5;

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

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

  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (error) {
    console.error("NEWSLETTER CLOUDINARY DELETE ERROR:", error);
  }
};

const cleanupExpiredNewsletters = async (now = new Date()) => {
  const expiredNewsletters = await Newsletter.find(
    { expiresAt: { $lte: now } },
    { _id: 1, coverImage: 1, coverPublicId: 1 }
  )
    .sort({ expiresAt: 1 })
    .limit(MAX_CLEANUP_BATCH)
    .lean();

  if (!expiredNewsletters.length) return;

  await Promise.allSettled(expiredNewsletters.map(deleteCloudinaryImage));

  await Newsletter.deleteMany({
    _id: { $in: expiredNewsletters.map((newsletter) => newsletter._id) },
  });
};

const serializeNewsletter = (newsletter) => ({
  id: newsletter._id?.toString?.() || String(newsletter._id || ""),
  clubId: newsletter.clubId?.toString?.() || String(newsletter.clubId || ""),
  clubName: newsletter.clubName,
  clubLogo: normalizeImage(newsletter.clubLogo) || "/Defaultclublogo.svg",
  price: Number(newsletter.price || 0),
  description: newsletter.description,
  coverImage: newsletter.coverImage,
  createdAt: newsletter.createdAt,
  expiresAt: newsletter.expiresAt,
});

export async function GET() {
  try {
    await connectDB();

    const now = new Date();
    await cleanupExpiredNewsletters(now);

    const newsletters = await Newsletter.find({ expiresAt: { $gt: now } })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ newsletters: newsletters.map(serializeNewsletter) });
  } catch (error) {
    console.error("GET NEWSLETTER ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const sessionEmail = normalizeEmail(session?.user?.email);

    if (!sessionEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    await cleanupExpiredNewsletters(new Date());

    const formData = await req.formData();
    const clubId = typeof formData.get("clubId") === "string" ? formData.get("clubId").trim() : "";
    const rawDescription =
      typeof formData.get("description") === "string" ? formData.get("description").trim() : "";
    const description = rawDescription.slice(0, MAX_DESCRIPTION_LENGTH);
    const rawPrice = Number(formData.get("price") || 0);
    const price = Number.isFinite(rawPrice) ? Math.max(0, Math.round(rawPrice)) : 0;
    const file = formData.get("coverImage");

    if (!clubId) {
      return NextResponse.json({ error: "Club is required" }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    if (!file || typeof file.arrayBuffer !== "function" || !file.type?.startsWith("image/")) {
      return NextResponse.json({ error: "Cover image is required" }, { status: 400 });
    }

    const club = await Club.findOne(
      { _id: clubId, "leaders.email": sessionEmail },
      { _id: 1, clubName: 1, logo: 1 }
    ).lean();

    if (!club) {
      return NextResponse.json(
        { error: "You are not authorized to publish newsletters for this club" },
        { status: 403 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "newsletter" }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        })
        .end(buffer);
    });

    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + SEVEN_DAYS_IN_MS);

    const newsletter = await Newsletter.create({
      clubId: club._id,
      clubName: club.clubName || "Club",
      clubLogo: normalizeImage(club.logo) || "/Defaultclublogo.svg",
      price,
      description,
      coverImage: uploadResult.secure_url,
      coverPublicId: uploadResult.public_id,
      expiresAt,
    });

    return NextResponse.json(
      { newsletter: serializeNewsletter(newsletter.toObject()) },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE NEWSLETTER ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
