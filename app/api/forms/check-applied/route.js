import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import ResponseModel from "@/models/Response";

export async function GET(req) {
  try {
    await connectDB();

    const session = await auth();

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
    const registration = applied ? response?.answers?.teamRegistration : null;
    const teamName = response?.teamFinder?.type === "team"
      ? response.teamFinder.team?.name || response.answers?.teamName || response.answers?.teamRegistration?.teamName || ""
      : registration?.teamName || response?.answers?.teamName || "";
    const hasTeam = Boolean(
      response?.teamFinder?.type === "team" ||
      (applied && (teamName ||
        (Array.isArray(response?.answers?.team) && response.answers.team.some((member) => Object.values(member || {}).some((value) => String(value || "").trim()))) ||
        (Array.isArray(registration?.members) && registration.members.length)))
    );

    return Response.json({ applied, teamFinderComplete, hasTeam, teamName });

  } catch (error) {
    console.error(error);
    return Response.json({ applied: false });
  }
}
