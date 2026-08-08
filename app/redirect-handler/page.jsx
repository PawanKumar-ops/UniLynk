import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export default async function RedirectHandler() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  await connectDB();
  const user = await User.findOne({ email: session.user.email });

  if (!user || !user.profileCompleted) {
    redirect("/UserinfoForm");
  }

  redirect("/dashboard");
}
