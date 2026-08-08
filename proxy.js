import NextAuth from "next-auth";
import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: [
    "/Onboarding/:path*",
    "/dashboard/:path*",
    "/Profile/:path*",
    "/UserinfoForm/:path*",
    "/NewClubForm/:path*",
  ],
};