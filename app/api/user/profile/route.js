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

    const { branch, year, skills, img } = await req.json();

    const updatePayload = {
      branch: typeof branch === "string" ? branch.trim() : "",
      year: typeof year === "string" ? year.trim() : "",
      skills: Array.isArray(skills)
        ? skills
            .map((skill) => (typeof skill === "string" ? skill.trim() : ""))
            .filter(Boolean)
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
