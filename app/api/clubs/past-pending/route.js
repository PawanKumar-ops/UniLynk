import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Club from "@/models/Club";
import Form from "@/models/Form";

export async function GET(req) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const userEmail = session.user.email.toLowerCase().trim();

    // 1. Find all clubs where user is a leader
    const clubs = await Club.find({ "leaders.email": userEmail }).lean();

    if (!clubs || clubs.length === 0) {
      return Response.json([]);
    }

    const clubIds = clubs.map((c) => c._id);
    const clubMap = {};
    clubs.forEach((c) => {
      clubMap[c._id.toString()] = c;
    });

    // 2. Find all forms (events) for these clubs that are published
    const forms = await Form.find({
      clubId: { $in: clubIds },
      isPublished: true,
    }).lean();

    const now = new Date();
    const pending = [];

    for (const form of forms) {
      if (!form.date) continue;

      // Parse event dates saved as either YYYY-MM-DD or ISO strings. The form
      // builder stores dates as ISO strings, so appending another `T...` can
      // produce an invalid date and hide dashboard notifications.
      const datePart = String(form.date).split("T")[0];
      const dateTimeStr = form.time
        ? `${datePart}T${form.time}`
        : `${datePart}T00:00`;
      const eventDateTime = new Date(dateTimeStr);
      const fallbackDate = new Date(form.date);

      const comparableDate = !Number.isNaN(eventDateTime.getTime())
        ? eventDateTime
        : fallbackDate;

      if (Number.isNaN(comparableDate.getTime()) || comparableDate >= now) {
        continue;
      }

      const club = clubMap[form.clubId.toString()];
      if (!club) continue;

      // Check if it already exists in the club's activities
      const alreadyUpdated = (club.activities || []).some((act) => 
        (act.formId && act.formId.toString() === form._id.toString()) ||
        (!act.formId && act.title === form.title)
      );

      if (!alreadyUpdated) {
        pending.push({
          _id: form._id.toString(),
          title: form.title,
          date: form.date,
          time: form.time,
          clubId: form.clubId.toString(),
          clubName: club.clubName,
          clubLogo: club.logo || "/Defaultclublogo.svg",
        });
      }
    }

    return Response.json(pending);
  } catch (error) {
    console.error("FETCH PENDING PAST EVENTS ERROR:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
