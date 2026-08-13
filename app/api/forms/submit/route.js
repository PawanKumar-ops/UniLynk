import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import FormResponse from "@/models/Response"; // renamed to avoid conflict
import Form from "@/models/Form";
import User from "@/models/user";

const REGISTRATION_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRegistrationId() {
  let code = "";
  for (let i = 0; i < 8; i += 1) {
    code += REGISTRATION_CHARS[Math.floor(Math.random() * REGISTRATION_CHARS.length)];
  }
  return `UL-${code}`;
}

async function generateUniqueRegistrationId() {
  for (let i = 0; i < 8; i += 1) {
    const registrationId = generateRegistrationId();
    const existing = await FormResponse.exists({ registrationId });
    if (!existing) return registrationId;
  }
  throw new Error("Unable to generate registration id");
}

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
    const registrationId = existing?.registrationId || await generateUniqueRegistrationId();
    const user = await User.findOne({ email: userEmail }, { name: 1, rollNumber: 1 }).lean();
    const newResponse = existing
      ? await FormResponse.findByIdAndUpdate(
          existing._id,
          { $set: { answers, registrationId, isSubmitted: true, submittedAt } },
          { new: true, runValidators: true }
        )
      : await FormResponse.create({
          formId,
          userEmail,
          answers,
          registrationId,
          isSubmitted: true,
          submittedAt
        });

    const responseObject = newResponse.toObject ? newResponse.toObject() : newResponse;

    return Response.json({
      ...responseObject,
      userName: user?.name || session.user.name || "",
      rollNo: user?.rollNumber || "",
    });

  } catch (error) {
    console.error(error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
