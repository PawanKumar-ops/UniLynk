import { auth } from "@/auth";
import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { connectDB } from "@/lib/mongodb";
import { cleanupExpiredNewsletters, NEWSLETTER_TTL_MS } from "@/lib/newsletterCleanup";
import Club from "@/models/Club";
import Newsletter from "@/models/Newsletter";
import User from "@/models/user";

const MAX_DESCRIPTION_LENGTH = 120;

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

const serializeNewsletter = (newsletter, leaderUserByClubId = new Map()) => {
  const cover = newsletter.coverImage || "";
  const clubName = newsletter.clubName || "Club";
  const dateStr = newsletter.createdAt
    ? new Date(newsletter.createdAt).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  return {
    id: newsletter._id?.toString?.() || String(newsletter._id || ""),
    _id: newsletter._id?.toString?.() || String(newsletter._id || ""),
    clubId: newsletter.clubId?.toString?.() || String(newsletter.clubId || ""),
    clubName,
    club: clubName,
    clubLogo: normalizeImage(newsletter.clubLogo) || "/Defaultclublogo.svg",
    price: Number(newsletter.price || 0),
    description: newsletter.description || "",
    coverImage: cover,
    image: cover,
    leaderUserId: leaderUserByClubId.get(String(newsletter.clubId || "")) || "",
    createdAt: newsletter.createdAt,
    date: dateStr,
    expiresAt: newsletter.expiresAt,
  };
};

async function handleImageUpload(fileOrDataUrl) {
  if (!fileOrDataUrl) return { secure_url: "", public_id: "" };

  if (typeof fileOrDataUrl === "object" && typeof fileOrDataUrl.arrayBuffer === "function") {
    const bytes = await fileOrDataUrl.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "newsletter" }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        })
        .end(buffer);
    });
    return uploadResult;
  }

  if (typeof fileOrDataUrl === "string") {
    const trimmed = fileOrDataUrl.trim();
    if (trimmed.startsWith("data:image/")) {
      const uploadResult = await cloudinary.uploader.upload(trimmed, {
        folder: "newsletter",
      });
      return uploadResult;
    }
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return { secure_url: trimmed, public_id: "" };
    }
  }

  return { secure_url: "", public_id: "" };
}

export async function GET(req) {
  try {
    await connectDB();

    const now = new Date();
    await cleanupExpiredNewsletters(now);

    const url = new URL(req.url);
    const leadershipOnly =
      url.searchParams.get("leadershipOnly") === "true" ||
      url.searchParams.get("mine") === "true";
    const newsletterId = url.searchParams.get("id");

    if (newsletterId) {
      const newsletter = await Newsletter.findById(newsletterId).lean();
      if (!newsletter) {
        return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
      }
      return NextResponse.json({ newsletter: serializeNewsletter(newsletter) });
    }

    if (leadershipOnly) {
      const session = await auth();
      const sessionEmail = normalizeEmail(session?.user?.email);

      if (!sessionEmail) {
        return NextResponse.json({ newsletters: [] });
      }

      const userClubs = await Club.find(
        { "leaders.email": sessionEmail },
        { _id: 1 }
      ).lean();

      const clubIds = userClubs.map((c) => c._id);
      if (clubIds.length === 0) {
        return NextResponse.json({ newsletters: [] });
      }

      const newsletters = await Newsletter.find({ clubId: { $in: clubIds } })
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json({
        newsletters: newsletters.map((newsletter) => serializeNewsletter(newsletter)),
      });
    }

    const newsletters = await Newsletter.find({ expiresAt: { $gt: now } })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const clubIds = [...new Set(newsletters.map((newsletter) => String(newsletter.clubId || "")).filter(Boolean))];
    const clubs = clubIds.length
      ? await Club.find({ _id: { $in: clubIds } }, { leaders: 1 }).lean()
      : [];
    const leaderEmailByClubId = new Map(
      clubs
        .map((club) => [
          String(club._id),
          normalizeEmail((Array.isArray(club.leaders) ? club.leaders : []).find((leader) => leader?.email)?.email),
        ])
        .filter(([, email]) => Boolean(email))
    );
    const users = leaderEmailByClubId.size
      ? await User.find(
          { email: { $in: [...leaderEmailByClubId.values()] } },
          { _id: 1, email: 1 }
        ).lean()
      : [];
    const userIdByEmail = new Map(users.map((user) => [normalizeEmail(user.email), String(user._id)]));
    const leaderUserByClubId = new Map(
      [...leaderEmailByClubId.entries()]
        .map(([clubId, email]) => [clubId, userIdByEmail.get(email) || ""])
        .filter(([, userId]) => Boolean(userId))
    );

    return NextResponse.json({
      newsletters: newsletters.map((newsletter) => serializeNewsletter(newsletter, leaderUserByClubId)),
    });
  } catch (error) {
    console.error("GET NEWSLETTER ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    const sessionEmail = normalizeEmail(session?.user?.email);

    if (!sessionEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    await cleanupExpiredNewsletters(new Date());

    let clubId = "";
    let rawDescription = "";
    let rawPrice = 0;
    let coverSource = null;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      clubId = typeof formData.get("clubId") === "string" ? formData.get("clubId").trim() : "";
      rawDescription =
        typeof formData.get("description") === "string" ? formData.get("description").trim() : "";
      rawPrice = Number(formData.get("price") || 0);
      coverSource = formData.get("coverImage") || formData.get("image");
    } else {
      const body = await req.json().catch(() => ({}));
      clubId = typeof body.clubId === "string" ? body.clubId.trim() : "";
      rawDescription = typeof body.description === "string" ? body.description.trim() : "";
      rawPrice = Number(body.price || 0);
      coverSource = body.coverImage || body.image;
    }

    const description = rawDescription.slice(0, MAX_DESCRIPTION_LENGTH);
    const price = Number.isFinite(rawPrice) ? Math.max(0, Math.round(rawPrice)) : 0;

    if (!clubId) {
      return NextResponse.json({ error: "Club is required" }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    if (!coverSource) {
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

    const uploadResult = await handleImageUpload(coverSource);
    if (!uploadResult.secure_url) {
      return NextResponse.json({ error: "Failed to process cover image" }, { status: 400 });
    }

    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + NEWSLETTER_TTL_MS);

    const newsletter = await Newsletter.create({
      clubId: club._id,
      clubName: club.clubName || "Club",
      clubLogo: normalizeImage(club.logo) || "/Defaultclublogo.svg",
      price,
      description,
      coverImage: uploadResult.secure_url,
      coverPublicId: uploadResult.public_id || "",
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

export async function PUT(req) {
  try {
    const session = await auth();
    const sessionEmail = normalizeEmail(session?.user?.email);

    if (!sessionEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    let id = "";
    let clubId = "";
    let rawDescription = "";
    let rawPrice = 0;
    let coverSource = null;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      id = typeof formData.get("id") === "string" ? formData.get("id").trim() : "";
      clubId = typeof formData.get("clubId") === "string" ? formData.get("clubId").trim() : "";
      rawDescription =
        typeof formData.get("description") === "string" ? formData.get("description").trim() : "";
      rawPrice = Number(formData.get("price") || 0);
      coverSource = formData.get("coverImage") || formData.get("image");
    } else {
      const body = await req.json().catch(() => ({}));
      id = typeof body.id === "string" ? body.id.trim() : "";
      clubId = typeof body.clubId === "string" ? body.clubId.trim() : "";
      rawDescription = typeof body.description === "string" ? body.description.trim() : "";
      rawPrice = Number(body.price || 0);
      coverSource = body.coverImage || body.image;
    }

    if (!id) {
      return NextResponse.json({ error: "Newsletter ID is required" }, { status: 400 });
    }

    const existing = await Newsletter.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
    }

    const targetClubId = clubId || String(existing.clubId);

    const club = await Club.findOne(
      { _id: targetClubId, "leaders.email": sessionEmail },
      { _id: 1, clubName: 1, logo: 1 }
    ).lean();

    if (!club) {
      return NextResponse.json(
        { error: "You are not authorized to edit newsletters for this club" },
        { status: 403 }
      );
    }

    const description = rawDescription.slice(0, MAX_DESCRIPTION_LENGTH) || existing.description;
    const price = Number.isFinite(rawPrice) ? Math.max(0, Math.round(rawPrice)) : existing.price;

    existing.description = description;
    existing.price = price;
    existing.clubId = club._id;
    existing.clubName = club.clubName || existing.clubName;
    if (club.logo) {
      existing.clubLogo = normalizeImage(club.logo);
    }

    if (coverSource && coverSource !== existing.coverImage) {
      const uploadResult = await handleImageUpload(coverSource);
      if (uploadResult.secure_url) {
        existing.coverImage = uploadResult.secure_url;
        existing.coverPublicId = uploadResult.public_id || existing.coverPublicId;
      }
    }

    await existing.save();

    return NextResponse.json({ newsletter: serializeNewsletter(existing.toObject()) });
  } catch (error) {
    console.error("UPDATE NEWSLETTER ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await auth();
    const sessionEmail = normalizeEmail(session?.user?.email);

    if (!sessionEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const url = new URL(req.url);
    let id = url.searchParams.get("id");

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = typeof body.id === "string" ? body.id.trim() : "";
    }

    if (!id) {
      return NextResponse.json({ error: "Newsletter ID is required" }, { status: 400 });
    }

    const newsletter = await Newsletter.findById(id);
    if (!newsletter) {
      return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
    }

    const club = await Club.findOne(
      { _id: newsletter.clubId, "leaders.email": sessionEmail },
      { _id: 1 }
    ).lean();

    if (!club) {
      return NextResponse.json(
        { error: "You are not authorized to delete newsletters for this club" },
        { status: 403 }
      );
    }

    await Newsletter.deleteOne({ _id: id });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE NEWSLETTER ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

