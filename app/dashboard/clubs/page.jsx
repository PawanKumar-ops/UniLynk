import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardClient from "../DashboardClient";

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return <DashboardClient />;
}
