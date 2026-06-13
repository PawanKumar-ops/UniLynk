import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import DashboardClient from "../DashboardClient";

export default async function ForYouFeedPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return <DashboardClient initialAudience="for-you" />;
}
