import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Form from "@/models/Form";
import FormResponse from "@/models/Response";

const normalizeEmail = (email = "") => String(email).toLowerCase().trim();

export async function PUT(req, context) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const form = await Form.findById(id).lean();
    if (!form) return Response.json({ error: "Form not found" }, { status: 404 });
    if (normalizeEmail(form.createdBy) !== normalizeEmail(session.user.email)) return Response.json({ error: "Forbidden" }, { status: 403 });
    if (!form.isTeam && !form.isTeamEvent) return Response.json({ error: "This event does not support teams" }, { status: 400 });

    const { teams = [], solo = [] } = await req.json();
    if (!Array.isArray(teams) || !Array.isArray(solo)) return Response.json({ error: "Invalid team payload" }, { status: 400 });

    const teamResponseIds = new Set();
    const assignedEmails = new Set();
    const adminTeams = [];
    for (const team of teams) {
      const responseId = team._id || team.id;
      if (!responseId) continue;
      const members = Array.isArray(team.members) ? team.members : [];
      const capacity = Math.max(1, Number(team.capacity || team.total || form.teamSize || 1));
      if (members.length > capacity) return Response.json({ error: `Team ${team.name || ""} exceeds its capacity` }, { status: 400 });
      members.forEach((member) => { const email = normalizeEmail(member.email); if (email) assignedEmails.add(email); });
      if (team.source === "admin" || String(team.id || "").startsWith("admin_")) {
        adminTeams.push({
          ...(String(team._id || "").match(/^[a-f\d]{24}$/i) ? { _id: team._id } : {}),
          name: String(team.name || "").trim() || "Admin Team",
          capacity,
          members,
        });
        continue;
      }
      teamResponseIds.add(String(responseId));
      const response = await FormResponse.findOne({ _id: responseId, formId: id });
      if (!response) continue;
      if (response.answers?.teamRegistration) {
        response.answers.teamRegistration.teamName = team.name || response.answers.teamRegistration.teamName;
        response.answers.teamRegistration.members = members;
        response.markModified("answers");
      }
      if (Array.isArray(response.answers?.team)) {
        response.answers.team = members;
        response.markModified("answers");
      }
      if (response.teamFinder?.type === "team") {
        response.teamFinder.team.name = team.name || response.teamFinder.team.name;
        response.teamFinder.team.members = members;
        response.teamFinder.team.total = capacity;
        response.teamFinder.team.needed = Math.max(0, capacity - members.length);
        response.markModified("teamFinder");
      }
      await response.save();
    }

    await Form.findByIdAndUpdate(id, { $set: { adminTeams } });
    const responses = await FormResponse.find({ formId: id }).select("_id userEmail teamFinder");
    const explicitSoloIds = new Set(solo.map((student) => String(student._id || student.id || "")).filter(Boolean));
    await Promise.all(responses.map(async (response) => {
      const responseId = String(response._id);
      if (teamResponseIds.has(responseId)) return;
      if (explicitSoloIds.has(responseId)) {
        if (response.teamFinder?.type === "team") {
          response.teamFinder.type = "solo";
          response.teamFinder.team = undefined;
          response.markModified("teamFinder");
          await response.save();
        }
        return;
      }
      if (assignedEmails.has(normalizeEmail(response.userEmail)) && response.teamFinder?.type === "solo") {
        response.teamFinder = undefined;
        response.markModified("teamFinder");
        await response.save();
      }
    }));

    return Response.json({ success: true });
  } catch (error) {
    console.error("Teams update error:", error);
    return Response.json({ error: "Unable to update teams" }, { status: 500 });
  }
}
