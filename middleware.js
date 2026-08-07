import { withAuth } from "next-auth/middleware";

export default withAuth();

export const config = {
  matcher: [
    "/Onboarding/:path*",
    "/dashboard/:path*",
    "/Profile/:path*",
    "/UserinfoForm/:path*",
    "/NewClubForm/:path*",
  ],
};