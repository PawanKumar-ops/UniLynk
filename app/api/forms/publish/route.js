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
    const { formId, clubId, visibility } = await req.json();

    if (!formId) {
      return Response.json(
        { error: "Form ID is required" },
        { status: 400 }
      );
    }

    const updatedForm = await Form.findOneAndUpdate(
      {
        _id: formId,
        createdBy: session.user.email.toLowerCase(),
      },
      {
        isPublic: visibility !== "members",
        visibility: visibility === "members" ? "members" : "everyone",
        clubId: clubId || null,
        isPublished: true,
        publishedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedForm) {
      return Response.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    return Response.json(updatedForm);

  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to publish form" },
      { status: 500 }
    );
  }
}
