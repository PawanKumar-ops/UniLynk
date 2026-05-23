import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import Userprofile from "../../Userprofile/page";

export default async function SearchUserPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");
  return <Userprofile />;
}
