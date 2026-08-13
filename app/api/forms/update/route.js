import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Form from "@/models/Form";
export async function PUT(req) {
  try {
    await connectDB();

    const session = await auth();

    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { formId, formData } = await req.json();

    if (!formId) {
      return Response.json(
        { error: "Missing formId" },
        { status: 400 }
      );
    }

    const title = (formData.name || formData.title || "").trim();
    const pointsList = Array.isArray(formData.points)
      ? formData.points.map((p) => (typeof p === "string" ? p : p.text || "")).filter(Boolean)
      : Array.isArray(formData.moreInformation)
      ? formData.moreInformation
      : [];

    const questionsList = Array.isArray(formData.questions)
      ? formData.questions.map((q) => ({
          id: q.id,
          type: q.type,
          title: q.title || q.question || "",
          question: q.title || q.question || "",
          required: Boolean(q.required),
          options: Array.isArray(q.options) ? q.options : [],
        }))
      : [];

    const normalizedFormData = {
      title,
      name: title,
      description: formData.description || "",
      points: pointsList,
      moreInformation: pointsList,
      date: formData.date || "",
      time: formData.time || "",
      venue: formData.venue || formData.location || "",
      location: formData.venue || formData.location || "",
      banner: formData.banner || formData.image || "",
      image: formData.banner || formData.image || "",
      isTeam: Boolean(formData.isTeam ?? formData.isTeamEvent),
      isTeamEvent: Boolean(formData.isTeam ?? formData.isTeamEvent),
      teamSize: Number(formData.teamSize || 4),
      questions: questionsList,
      ...(formData.clubId !== undefined ? { clubId: formData.clubId } : {}),
      ...(formData.visibility ? { visibility: formData.visibility } : {}),
      ...(formData.isPublished !== undefined ? { isPublished: Boolean(formData.isPublished) } : {}),
    };

    const updatedForm = await Form.findOneAndUpdate(
      {
        _id: formId,
        createdBy: session.user.email.toLowerCase(),
      },
      normalizedFormData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedForm) {
      return Response.json({ error: "Form not found" }, { status: 404 });
    }

    return Response.json(updatedForm);

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

