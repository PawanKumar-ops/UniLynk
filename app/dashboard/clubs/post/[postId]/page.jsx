import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import DashboardClient from "../../../DashboardClient";

export default async function ClubsPostThreadPage({ params }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const { postId } = await params;

  return <DashboardClient postId={postId} initialAudience="clubs" />;
}
