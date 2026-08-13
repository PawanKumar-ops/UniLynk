import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Form from "@/models/Form";


export async function POST(req) {
  try {
    await connectDB();
    const session = await auth();

    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const normalizedEmail = session.user.email.toLowerCase();

    const title = (data.name || data.title || "").trim();
    const pointsList = Array.isArray(data.points)
      ? data.points.map((p) => (typeof p === "string" ? p : p.text || "")).filter(Boolean)
      : Array.isArray(data.moreInformation)
      ? data.moreInformation
      : [];

    const questionsList = Array.isArray(data.questions)
      ? data.questions.map((q) => ({
          id: q.id,
          type: q.type,
          title: q.title || q.question || "",
          question: q.title || q.question || "",
          required: Boolean(q.required),
          options: Array.isArray(q.options) ? q.options : [],
        }))
      : [];

    const payload = {
      title,
      name: title,
      description: data.description || "",
      points: pointsList,
      moreInformation: pointsList,
      date: data.date || "",
      time: data.time || "",
      venue: data.venue || data.location || "",
      location: data.venue || data.location || "",
      banner: data.banner || data.image || "",
      image: data.banner || data.image || "",
      isTeam: Boolean(data.isTeam ?? data.isTeamEvent),
      isTeamEvent: Boolean(data.isTeam ?? data.isTeamEvent),
      teamSize: Number(data.teamSize || 4),
      questions: questionsList,
      createdBy: normalizedEmail,
      clubId: data.clubId || null,
      visibility: data.visibility || (data.isPublic ? "everyone" : "everyone"),
      isPublic: data.isPublic !== false,
      isPublished: Boolean(data.isPublished),
      ...(data.isPublished && !data.publishedAt ? { publishedAt: new Date() } : {}),
    };

    const form = await Form.create(payload);
    return Response.json(form);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
