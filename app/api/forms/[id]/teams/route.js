import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Form from "@/models/Form";
import FormResponse from "@/models/Response";

export async function PUT(req, context) {
  try {
    await connectDB();
    const session = await auth();

    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const form = await Form.findById(id);

    if (!form) {
      return Response.json({ error: "Form not found" }, { status: 404 });
    }

    const viewerEmail = session.user.email.toLowerCase();
    const isOwner = form.createdBy && form.createdBy.toLowerCase() === viewerEmail;

    if (!isOwner) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { teams = [], solo = [] } = body;

    // Process updated teams
    for (const team of teams) {
      if (team._id || team.id) {
        const responseId = team._id || team.id;
        const response = await FormResponse.findById(responseId);
        if (response) {
          // If response has teamRegistration answer
          if (response.answers && response.answers.teamRegistration) {
            response.answers.teamRegistration.teamName = team.name || response.answers.teamRegistration.teamName;
            response.answers.teamRegistration.members = team.members || [];
            response.markModified("answers");
          }
          // If response has teamFinder team
          if (response.teamFinder && response.teamFinder.type === "team") {
            response.teamFinder.team.name = team.name || response.teamFinder.team.name;
            response.teamFinder.team.members = team.members || [];
            response.teamFinder.team.needed = Math.max(0, (team.capacity || team.total || 4) - (team.members?.length || 0));
            response.markModified("teamFinder");
          }
          await response.save();
        }
      }
    }

    // Process solo members
    for (const soloUser of solo) {
      if (soloUser._id || soloUser.id) {
        const responseId = soloUser._id || soloUser.id;
        const response = await FormResponse.findById(responseId);
        if (response && response.teamFinder && response.teamFinder.type === "team") {
          // Move from team to solo if needed
          response.teamFinder.type = "solo";
          response.markModified("teamFinder");
          await response.save();
        }
      }
    }

    return Response.json({ success: true, message: "Teams updated successfully" });
  } catch (error) {
    console.error("Teams update error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
