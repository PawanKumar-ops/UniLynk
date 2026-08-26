import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import { syncUserClubProfile } from "@/lib/clubProfileSync";

const isStoredProfileImage = (value, fallback) =>
  value === fallback || /^https:\/\/res\.cloudinary\.com\//i.test(value);

export async function PATCH(req) {
  try {
    await connectDB();

    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { name, branch, year, skills, socials, achievements, img, banner } = await req.json();

    if (typeof banner === "string" && banner.trim() && !isStoredProfileImage(banner.trim(), "/Background.jpg")) {
      return Response.json({ error: "Banner must be uploaded before saving your profile." }, { status: 400 });
    }

    const updatePayload = {
      branch: typeof branch === "string" ? branch.trim() : "",
      year: typeof year === "string" ? year.trim() : "",
      skills: Array.isArray(skills)
        ? skills
            .map((skill) => (typeof skill === "string" ? skill.trim() : ""))
            .filter(Boolean)
        : [],
      socials: Array.isArray(socials)
        ? socials
            .map((social) => ({
              platform: typeof social?.platform === "string" ? social.platform.trim() : "",
              url: typeof social?.url === "string" ? social.url.trim() : "",
            }))
            .filter((social) => social.platform && social.url)
        : [],
      achievements: Array.isArray(achievements)
        ? achievements.map((achievement) => {
            if (typeof achievement === "string") {
              return { title: achievement.trim(), description: "", date: "" };
            }
            return {
              title: typeof achievement?.title === "string" ? achievement.title.trim() : "",
              description: typeof achievement?.description === "string" ? achievement.description.trim() : "",
              date: typeof achievement?.date === "string" ? achievement.date.trim() : "",
            };
          }).filter((achievement) => achievement.title)
        : [],
      profileCompleted: true,
    };

    if (typeof name === "string" && name.trim()) {
      updatePayload.name = name.trim();
    }

    if (typeof img === "string" && img.trim()) {
      updatePayload.img = img.trim();
    }

    if (typeof banner === "string" && banner.trim()) {
      updatePayload.banner = banner.trim();
    }

    const email = session.user.email.toLowerCase().trim();

    const user = await User.findOneAndUpdate(
      { email },
      updatePayload,
      { new: true }
    ).select("-password");

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    await syncUserClubProfile(user);

    return Response.json({ success: true, user }, { status: 200 });
  } catch (error) {
    console.error("PROFILE UPDATE ERROR:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
