import { connectDB } from "@/lib/mongodb";
import Club from "@/models/Club";

const sanitizeClubPayload = (data = {}) => ({
  clubName: typeof data.clubName === "string" ? data.clubName.trim() : "",
  category: typeof data.category === "string" ? data.category.trim() : "",
  description: typeof data.description === "string" ? data.description.trim() : "",
  logo: typeof data.logo === "string" ? data.logo : "",
  banner: typeof data.banner === "string" ? data.banner : "",
  memberCount: Number.isFinite(Number(data.memberCount)) ? Number(data.memberCount) : 0,
  foundedDate: typeof data.foundedDate === "string" ? data.foundedDate : "",
  email: typeof data.email === "string" ? data.email.trim() : "",
  phone: typeof data.phone === "string" ? data.phone.trim() : "",
  website: typeof data.website === "string" ? data.website.trim() : "",
  instagram: typeof data.instagram === "string" ? data.instagram.trim() : "",
  twitter: typeof data.twitter === "string" ? data.twitter.trim() : "",
  linkedin: typeof data.linkedin === "string" ? data.linkedin.trim() : "",
  activities: Array.isArray(data.activities)
    ? data.activities.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim())
    : [],
  leaders: Array.isArray(data.leaders) ? data.leaders : [],
  pastEvents: Array.isArray(data.pastEvents) ? data.pastEvents : [],
  upcomingEvents: Array.isArray(data.upcomingEvents) ? data.upcomingEvents : [],
});

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const payload = sanitizeClubPayload(body);

    if (!payload.clubName || !payload.category || !payload.description) {
      return Response.json(
        { error: "clubName, category and description are required" },
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
