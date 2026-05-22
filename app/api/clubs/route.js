import { connectDB } from "@/lib/mongodb";
import Club from "@/models/Club";

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
});

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const payload = sanitizeClubPayload(body);

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
    return Response.json({ club }, { status: 201 });
  } catch (error) {
    console.error("CREATE CLUB ERROR:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
