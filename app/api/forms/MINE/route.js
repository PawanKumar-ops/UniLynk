import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Form from "@/models/Form";

export async function GET() {
  try {
    await connectDB();

    const session = await auth();

    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const forms = await Form.find({
      createdBy: session.user.email.toLowerCase(),
    }).sort({ createdAt: -1 });

    return Response.json(forms);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
