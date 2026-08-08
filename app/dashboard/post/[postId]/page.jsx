import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardClient from "../../DashboardClient";

export default async function PostThreadPage({ params }) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const { postId } = await params;

  return <DashboardClient postId={postId} />;
}
