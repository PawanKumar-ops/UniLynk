import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Club from "@/models/Club";
import Form from "@/models/Form";

const parseEventDateTime = (date, time) => {
  if (!date) return null;

  // Parse event dates saved as either YYYY-MM-DD or ISO strings. The form
  // builder stores dates as ISO strings, so appending another `T...` can
  // produce an invalid date and hide dashboard notifications.
  const datePart = String(date).split("T")[0];
  const timePart = String(time || "00:00").trim() || "00:00";
  const eventDateTime = new Date(`${datePart}T${timePart}`);

  if (!Number.isNaN(eventDateTime.getTime())) {
    return eventDateTime;
  }

  const fallbackDate = new Date(date);
  return Number.isNaN(fallbackDate.getTime()) ? null : fallbackDate;
};

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const userEmail = session.user.email.toLowerCase().trim();

    // Find all clubs where user is a leader because the past-activity modal
    // posts back to the club activities endpoint, which is leader-only.
    const clubs = await Club.find({ "leaders.email": userEmail }).lean();

    if (!clubs || clubs.length === 0) {
      return Response.json([]);
    }

    const clubIds = clubs.map((c) => c._id);
    const clubMap = {};
    clubs.forEach((c) => {
      clubMap[c._id.toString()] = c;
    });

    // Find all published FormBuilder events for these clubs.
    const forms = await Form.find({
      clubId: { $in: clubIds },
      isPublished: true,
    })
      .sort({ date: -1, time: -1, publishedAt: -1, updatedAt: -1 })
      .lean();

    const now = new Date();
    const pending = [];

    for (const form of forms) {
      const comparableDate = parseEventDateTime(form.date, form.time);

      if (!comparableDate || comparableDate > now) {
        continue;
      }

      const club = clubMap[form.clubId?.toString?.()];
      if (!club) continue;

      // Check if it already exists in the club's activities.
      const alreadyUpdated = (club.activities || []).some(
        (act) =>
          (act.formId && act.formId.toString() === form._id.toString()) ||
          (!act.formId && act.title === form.title),
      );

      if (!alreadyUpdated) {
        pending.push({
          _id: form._id.toString(),
          title: form.title,
          date: form.date,
          time: form.time,
          eventDateTime: comparableDate.toISOString(),
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
