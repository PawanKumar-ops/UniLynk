import { connectDB } from "@/lib/mongodb";
import Form from "@/models/Form";
import FormResponse from "@/models/Response";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req, context) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

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

    // Fetch all responses for this form
    const responses = await FormResponse.find({ formId: id }).lean();

    // Fetch user details for each response email
    const emails = responses.map(r => r.userEmail.toLowerCase());
    const users = await User.find({ email: { $in: emails } }).lean();

    // Map responses to include user profiles
    const populatedResponses = responses.map(r => {
      const u = users.find(user => user.email.toLowerCase() === r.userEmail.toLowerCase());
      return {
        ...r,
        user: u ? {
          name: u.name,
          year: u.year,
          branch: u.branch,
          img: u.img
        } : {
          name: r.userEmail.split("@")[0],
          year: "N/A",
          branch: "N/A",
          img: null
        }
      };
    });

    return Response.json({
      form,
      responses: populatedResponses
    });

  } catch (error) {
    console.error("Analytics fetch error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
