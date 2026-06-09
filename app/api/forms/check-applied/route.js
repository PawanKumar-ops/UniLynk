import { connectDB } from "@/lib/mongodb";
import ResponseModel from "@/models/Response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json({ applied: false });
    }

    const userEmail = session.user.email.toLowerCase().trim();

    const { searchParams } = new URL(req.url);
    const formId = searchParams.get("formId");

    const response = await ResponseModel.findOne({ formId, userEmail }).lean();
    const applied = Boolean(response?.isSubmitted || response?.submittedAt);
    const teamFinderComplete = Boolean(
      response?.teamFinder?.type || response?.teamFinderRequest?.kind === "team"
    );

    return Response.json({ applied, teamFinderComplete });

  } catch (error) {
    console.error(error);
    return Response.json({ applied: false });
  }
}