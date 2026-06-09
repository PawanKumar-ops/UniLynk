import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Club from "@/models/Club";
import cloudinary from "@/lib/cloudinary";
import { syncClubCommunity } from "@/lib/communitySync";
import { normalizeEmail } from "@/lib/clubProfileSync";

const uploadDataUrlToCloudinary = async (dataUrl, folder) => {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) return "";

  const result = await cloudinary.uploader.upload(dataUrl, {
    folder,
    resource_type: "image",
  });

  return typeof result?.secure_url === "string" ? result.secure_url : "";
};

const sanitizeClubPayload = (data = {}) => ({
  banner: typeof data.banner === "string" ? data.banner : "",
  logo: typeof data.logo === "string" ? data.logo : "",
  clubName: typeof data.clubName === "string" ? data.clubName.trim() : "",
  category: typeof data.category === "string" ? data.category.trim() : "",
  description: typeof data.description === "string" ? data.description.trim() : "",
  memberCount: Number.isFinite(Number(data.memberCount)) ? Number(data.memberCount) : 0,
  foundedDate: typeof data.foundedDate === "string" ? data.foundedDate : "",
  email: typeof data.email === "string" ? data.email.trim() : "",
  website: typeof data.website === "string" ? data.website.trim() : "",
  activities: Array.isArray(data.activities)
    ? data.activities
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          title: typeof item.title === "string" ? item.title.trim() : "",
          description: typeof item.description === "string" ? item.description.trim() : "",
        }))
        .filter((item) => item.title && item.description)
    : [],
  leaders: Array.isArray(data.leaders)
    ? data.leaders
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          email: typeof item.email === "string" ? item.email.trim().toLowerCase() : "",
          position: typeof item.position === "string" ? item.position.trim() : "",
          image: typeof item.image === "string" ? item.image.trim() : "/Profilepic.png",
          joiningYear: typeof item.joiningYear === "string" && item.joiningYear.trim()
            ? item.joiningYear.trim()
            : String(new Date().getFullYear()),
          joinedAt: item.joinedAt ? new Date(item.joinedAt) : new Date(),
        }))
        .filter((item) => item.email && item.position)
    : [],
});

export async function GET(req) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const url = new URL(req.url);
    const leadershipOnly = url.searchParams.get("leadershipOnly") === "true";
    const memberOf = url.searchParams.get("memberOf") === "true";
    const userEmail = normalizeEmail(session.user.email);

    let filter = {};

    if (leadershipOnly) {
      filter = { "leaders.email": userEmail };
    } else if (memberOf) {
      filter = {
        $or: [
          { "leaders.email": userEmail },
          { "members.email": userEmail },
        ],
      };
    }

    const clubs = await Club.find(filter)
      .sort({ updatedAt: -1 })
      .select("clubName category memberCount foundedDate logo banner leaders members createdAt updatedAt")
      .lean();

    const responseClubs = clubs.map((club) => {
      const leaders = Array.isArray(club.leaders) ? club.leaders : [];
      const members = Array.isArray(club.members) ? club.members : [];
      const leader = leaders.find((item) => normalizeEmail(item?.email) === userEmail);
      const member = members.find((item) => normalizeEmail(item?.email) === userEmail);
      const roleLabel = leader ? "Leadership Team" : (member?.position || "Member");

      return {
        _id: club._id,
        clubName: club.clubName,
        category: club.category,
        memberCount: club.memberCount,
        foundedDate: club.foundedDate,
        logo: club.logo,
        banner: club.banner,
        createdAt: club.createdAt,
        updatedAt: club.updatedAt,
        roleLabel,
        position: leader?.position || member?.position || "Member",
      };
    });

    return Response.json({ clubs: responseClubs }, { status: 200 });
  } catch (error) {
    console.error("FETCH CLUBS ERROR:", error);
    return Response.json({ message: "Failed to fetch clubs" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const payload = sanitizeClubPayload(body);

    payload.banner = await uploadDataUrlToCloudinary(payload.banner, "club-banners");
    payload.logo = await uploadDataUrlToCloudinary(payload.logo, "club-logos");

    if (
      !payload.clubName ||
      !payload.category ||
      !payload.description ||
      payload.memberCount < 1 ||
      !payload.foundedDate ||
      !payload.email ||
      payload.activities.length === 0
    ) {
      return Response.json(
        { error: "Required fields are missing or invalid" },
        { status: 400 }
      );
    }

    const club = await Club.create(payload);
    await syncClubCommunity(club);
    return Response.json({ club }, { status: 201 });
  } catch (error) {
    console.error("CREATE CLUB ERROR:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
