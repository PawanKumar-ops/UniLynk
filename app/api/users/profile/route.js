import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import { loreleiAvatar } from "@/lib/avatar";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email") || "").trim().toLowerCase();

    if (!email) {
      return Response.json({ exists: false, image: loreleiAvatar("") }, { status: 400 });
    }

    const user = await User.findOne({ email }).select("img").lean();

    return Response.json({
      exists: Boolean(user),
      image: user?.img || loreleiAvatar(email),
    });
  } catch (error) {
    console.error("USER PROFILE LOOKUP ERROR:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
