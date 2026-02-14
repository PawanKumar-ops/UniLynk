// import { getServerSession } from "next-auth";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";
// import { connectDB } from "@/lib/mongodb";
// import User from "@/models/user";
// import { NextResponse } from "next/server";

// export async function GET() {
//   const session = await getServerSession(authOptions);

//   if (!session?.user?.email) {
    
//     return NextResponse.json({}, { status: 401 });
//   }

//   await connectDB();

//   const user = await User.findOne(
//     { email: session.user.email },
//     { img: 1, name: 1, branch: 1, year: 1, skill: 1 }
//   ).lean();

//   return NextResponse.json(user || {});
// }
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const user = await User.findOne({ email: session.user.email }).select("-password").lean();

    if (!user) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    return Response.json({ user }, { status: 200 });
  } catch (error) {
    console.error("FETCH USER ERROR:", error);
    return Response.json({ message: "Failed to fetch user" }, { status: 500 });
  }
}
