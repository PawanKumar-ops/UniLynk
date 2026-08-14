import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export async function PATCH(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const { description = "" } = await req.json();
    const safeDescription = String(description || "").trim().slice(0, 600);
    await connectDB();
    const user = await User.findOneAndUpdate(
      { email: session.user.email.toLowerCase().trim() },
      { $set: { teamFinderDescription: safeDescription } },
      { new: true, projection: { teamFinderDescription: 1 } },
    ).lean();
    return Response.json({ description: user?.teamFinderDescription || "" });
  } catch (error) {
    console.error("TEAM FINDER PROFILE ERROR:", error);
    return Response.json({ error: "Could not save TeamFinder profile" }, { status: 500 });
  }
}
