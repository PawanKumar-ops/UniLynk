import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import cloudinary from "@/lib/cloudinary";
import { syncClubCommunity } from "@/lib/communitySync";
import { normalizeEmail } from "@/lib/clubProfileSync";
import Club from "@/models/Club";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_HIGHLIGHTS = 4;
const MAX_NAME_LENGTH = 120;
const MAX_CATEGORY_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 600;
const MAX_HIGHLIGHT_TITLE_LENGTH = 120;
const MAX_HIGHLIGHT_DESCRIPTION_LENGTH = 150;
const DATA_URL_RE = /^data:image\/(jpeg|png|webp);base64,/i;

function trimString(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function dataUrlSize(value) {
  const encoded = value.split(",")[1] || "";
  return Math.ceil((encoded.length * 3) / 4);
}

async function persistImage(value, folder, width, height) {
  if (typeof value !== "string" || !value.trim()) return "";
  const image = value.trim();
  if (!image.startsWith("data:")) return image;
  if (!DATA_URL_RE.test(image) || dataUrlSize(image) > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Images must be JPG, PNG, or WebP files no larger than 10 MB.");
  }
  const result = await cloudinary.uploader.upload(image, {
    folder,
    resource_type: "image",
    transformation: [{ width, height, crop: "limit", quality: "auto", fetch_format: "auto" }],
  });
  return result.secure_url;
}

export async function PATCH(req, { params }) {
  try {
    const session = await auth();
    const sessionEmail = normalizeEmail(session?.user?.email);
    if (!sessionEmail) return Response.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const club = await Club.findById(id);
    if (!club) return Response.json({ message: "Club not found" }, { status: 404 });
    if (!(club.leaders || []).some((leader) => normalizeEmail(leader?.email) === sessionEmail)) {
      return Response.json({ message: "Only club leaders can edit this profile" }, { status: 403 });
    }

    const body = await req.json();
    const clubName = trimString(body.clubName, MAX_NAME_LENGTH);
    const category = trimString(body.category, MAX_CATEGORY_LENGTH);
    const description = trimString(body.description, MAX_DESCRIPTION_LENGTH);
    if (!clubName || !category || !description) {
      return Response.json({ message: "Club name, category, and description are required" }, { status: 400 });
    }

    const activities = Array.isArray(body.activities) ? body.activities : [];
    if (activities.length > MAX_HIGHLIGHTS) {
      return Response.json({ message: "A club can have at most four highlights" }, { status: 400 });
    }
    const highlights = activities.map((item) => ({
      title: trimString(item?.title, MAX_HIGHLIGHT_TITLE_LENGTH),
      description: trimString(item?.description, MAX_HIGHLIGHT_DESCRIPTION_LENGTH),
    }));
    if (highlights.some((item) => !item.title || !item.description)) {
      return Response.json({ message: "Each highlight needs a title and description" }, { status: 400 });
    }

    const eligibleEmails = new Set([
      ...(club.members || []).map((member) => normalizeEmail(member?.email)),
      ...(club.leaders || []).map((leader) => normalizeEmail(leader?.email)),
    ]);
    const leaders = Array.isArray(body.leaders) ? body.leaders : [];
    const leaderMap = new Map();
    for (const item of leaders) {
      const email = normalizeEmail(item?.email);
      const position = trimString(item?.position, 80);
      if (!email || !position || !eligibleEmails.has(email)) {
        return Response.json({ message: "Leaders must be existing club members and have a role" }, { status: 400 });
      }
      leaderMap.set(email, position);
    }
    if (!leaderMap.has(sessionEmail)) {
      return Response.json({ message: "You cannot remove your own leadership access" }, { status: 400 });
    }

    const existingLeaders = new Map(
      (club.leaders || []).map((leader) => [normalizeEmail(leader?.email), leader])
    );
    const updatedLeaders = [...leaderMap].map(([email, position]) => {
      const existing = existingLeaders.get(email);
      return {
        email,
        position,
        image: existing?.image || "",
        joiningYear: existing?.joiningYear || String(new Date().getFullYear()),
        joinedAt: existing?.joinedAt || new Date(),
      };
    });
    const preservedActivities = (club.activities || []).filter((activity) => activity?.date || activity?.formId);
    const [banner, logo] = await Promise.all([
      persistImage(body.banner, "club-banners", 1500, 500),
      persistImage(body.logo, "club-logos", 800, 800),
    ]);

    // Use a targeted update so an editable profile can be saved even when an
    // older club document contains unrelated legacy fields that no longer meet
    // the current schema's validation rules.
    const updatedClub = await Club.findByIdAndUpdate(
      id,
      {
        $set: {
          clubName,
          category,
          description,
          banner,
          logo,
          activities: [...preservedActivities, ...highlights],
          leaders: updatedLeaders,
        },
      },
      { new: true }
    );
    await syncClubCommunity(updatedClub);
    return Response.json({ club: updatedClub }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("UPDATE CLUB PROFILE ERROR:", error);
    return Response.json({ message: error.message || "Failed to update club profile" }, { status: 500 });
  }
}
