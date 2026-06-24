import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

const normalizeEmail = (email) => {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
};

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return Response.json({ error: "Email parameter is required" }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }

    const user = await User.findOne({ email: normalizedEmail }, { _id: 1 }).lean();
    
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(
      { userId: user._id.toString() },
      { status: 200 }
    );
  } catch (error) {
    console.error("USER LOOKUP ERROR:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
