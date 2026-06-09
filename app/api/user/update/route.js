import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { syncUserClubProfile } from "@/lib/clubProfileSync";

export async function POST(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { name, branch, year, skills } = await req.json();

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        name: typeof name === "string" ? name.trim() : "",
        branch: typeof branch === "string" ? branch.trim() : "",
        year: typeof year === "string" ? year.trim() : "",
        skills: Array.isArray(skills)
          ? skills.map((skill) => (typeof skill === "string" ? skill.trim() : "")).filter(Boolean)
          : [],
        profileCompleted: true,
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    await syncUserClubProfile(user);

    return Response.json({ success: true, user });
  } catch (err) {
    console.error("USER UPDATE ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
