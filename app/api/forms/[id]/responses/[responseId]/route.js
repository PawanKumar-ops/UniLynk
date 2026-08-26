import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Form from "@/models/Form";
import FormResponse from "@/models/Response";

export async function GET(req, context) {
  try {
    await connectDB();
    const session = await auth();
    const { id, responseId } = await context.params;
    const [form, response] = await Promise.all([Form.findById(id).lean(), FormResponse.findOne({ _id: responseId, formId: id }).lean()]);
    if (!form || !response) return Response.json({ error: "Response not found" }, { status: 404 });
    if (!session?.user?.email || String(form.createdBy).toLowerCase() !== session.user.email.toLowerCase()) return Response.json({ error: "Forbidden" }, { status: 403 });
    return Response.json({ form, response });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}
