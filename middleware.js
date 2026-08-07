export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/Onboarding/:path*",
    "/dashboard/:path*",
    "/Profile/:path*",
    "/UserinfoForm/:path*",
    "/NewClubForm/:path*",
  ],
};
