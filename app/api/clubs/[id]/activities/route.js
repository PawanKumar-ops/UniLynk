import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Club from "@/models/Club";
import Form from "@/models/Form";

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const { id } = await params; // clubId
    const club = await Club.findById(id);

    if (!club) {
      return Response.json({ message: "Club not found" }, { status: 404 });
    }

    // Verify the user is a leader of this club
    const userEmail = session.user.email.toLowerCase().trim();
    const isLeader = (club.leaders || []).some(
      (leader) => leader.email.toLowerCase().trim() === userEmail
    );

    if (!isLeader) {
      return Response.json(
        { message: "Forbidden: You are not a leader of this club" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { formId, title, description, date, location, participants, images } = body;

    if (!formId || !title || !description || !location || !participants || !images) {
      return Response.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify that the form exists and belongs to this club
    const form = await Form.findById(formId);
    if (!form) {
      return Response.json({ message: "Form not found" }, { status: 400 });
    }

    if (form.clubId.toString() !== id) {
      return Response.json(
        { message: "Form does not belong to this club" },
        { status: 400 }
      );
    }

    // Add activity
    club.activities.push({
      title,
      description,
      date: date || form.date || "",
      location,
      participants: Number(participants) || 0,
      images: Array.isArray(images) ? images : [],
      formId,
    });

    await club.save();

    return Response.json({ message: "Activity added successfully", club });
  } catch (error) {
    console.error("ADD PAST EVENT ACTIVITY ERROR:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
