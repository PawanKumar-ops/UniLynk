import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import FormResponse from "@/models/Response"; // renamed to avoid conflict
import Form from "@/models/Form";

export async function POST(req) {
  try {
    await connectDB();

    const session = await auth();

    console.log("Session:", session); // DEBUG

    if (!session?.user?.email) {
      return Response.json(
        { error: "Unauthorized — No session email" },
        { status: 401 }
      );
    }

    const { formId, answers } = await req.json();

    console.log("Submit Payload:", formId, answers); // DEBUG

    const form = await Form.findById(formId, { _id: 1 }).lean();

    if (!form) {
      return Response.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    const userEmail = session.user.email.toLowerCase().trim();

    // ⭐ Prevent duplicate form submissions while still allowing Team Finder-only drafts
    const existing = await FormResponse.findOne({
      formId,
      userEmail
    });

    if (existing?.isSubmitted || existing?.submittedAt) {
      return Response.json(
        { error: "Already submitted" },
        { status: 400 }
      );
    }

    const submittedAt = new Date();
    const newResponse = existing
      ? await FormResponse.findByIdAndUpdate(
          existing._id,
          { $set: { answers, isSubmitted: true, submittedAt } },
          { new: true, runValidators: true }
        )
      : await FormResponse.create({
          formId,
          userEmail,
          answers,
          isSubmitted: true,
          submittedAt
        });

    return Response.json(newResponse);

  } catch (error) {
    console.error(error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
