import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { skills, img, socials } = await req.json();

    const updatePayload = {
      skills: Array.isArray(skills)
        ? skills
            .map((skill) => (typeof skill === "string" ? skill.trim() : ""))
            .filter(Boolean)
        : [],
      socials: Array.isArray(socials)
        ? socials
            .map((social) => ({
              platform:
                typeof social?.platform === "string"
                  ? social.platform.trim()
                  : "",
              url: typeof social?.url === "string" ? social.url.trim() : "",
            }))
            .filter((social) => social.platform && social.url)
        : [],
      profileCompleted: true,
    };

    if (typeof img === "string" && img.trim()) {
      updatePayload.img = img.trim();
    }

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      updatePayload,
      { new: true }
    ).select("-password");

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ success: true, user }, { status: 200 });
  } catch (error) {
    console.error("PROFILE UPDATE ERROR:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
