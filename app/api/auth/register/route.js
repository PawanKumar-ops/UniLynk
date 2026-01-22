import { connectDB } from "@/lib/mongodb";
import User from "@/models/user.js";
import bcrypt from "bcrypt";

export async function POST(req) {
  const { email, password } = await req.json();

  await connectDB();

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return new Response("User already exists", { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    email,
    password: hashedPassword,
    provider: "credentials",
  });

  return new Response("User created", { status: 201 });
}
