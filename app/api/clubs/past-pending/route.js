import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Club from "@/models/Club";
import Form from "@/models/Form";
import { leadershipClubFilter } from "@/lib/clubLeadership";

// Event dates/times are entered in campus local time (IST) without an offset.
// Servers run in UTC, so interpret them explicitly as IST; otherwise
// notifications arrive ~5.5 hours after the event actually starts.
const EVENT_TZ_OFFSET = process.env.EVENT_TZ_OFFSET || "+05:30";

const normalizeTime = (time) => {
  const raw = String(time || "").trim();
  const match = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*([AaPp][Mm])?$/);
  if (!match) return "00:00";
  let hours = Number(match[1]);
  const minutes = match[2] || "00";
  const meridiem = match[3]?.toLowerCase();
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${minutes}`;
};

const parseEventDateTime = (date, time) => {
  if (!date) return null;
  const raw = String(date);
  let datePart = raw.split("T")[0];

  // Full ISO timestamps (e.g. from a date picker) carry their own instant;
  // convert to the IST calendar day before combining with the event time.
  if (raw.includes("T")) {
    const instant = new Date(raw);
    if (!Number.isNaN(instant.getTime())) {
      const [, sign, h, m] = EVENT_TZ_OFFSET.match(/([+-])(\d{2}):(\d{2})/) || [];
      const offsetMs = sign ? (sign === "-" ? -1 : 1) * (Number(h) * 60 + Number(m)) * 60000 : 0;
      datePart = new Date(instant.getTime() + offsetMs).toISOString().split("T")[0];
    }
  }

  const eventDateTime = new Date(`${datePart}T${normalizeTime(time)}:00${EVENT_TZ_OFFSET}`);
  if (!Number.isNaN(eventDateTime.getTime())) return eventDateTime;

  const fallbackDate = new Date(date);
  return Number.isNaN(fallbackDate.getTime()) ? null : fallbackDate;
};

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const userEmail = session.user.email.toLowerCase().trim();

    // Find all clubs where user is a leader because the past-activity modal
    // posts back to the club activities endpoint, which is leader-only.
    // Every leadership-team member gets the prompt, whether listed under
    // `leaders` or as a member holding a leadership position.
    const clubs = await Club.find(leadershipClubFilter(userEmail)).lean();

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
