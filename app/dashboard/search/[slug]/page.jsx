import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Userprofile from "../../Userprofile/page";

export default async function SearchUserPage() {
  const session = await auth();
  if (!session) redirect("/");
  return <Userprofile />;
}
