import { connectDB } from "@/lib/mongodb";
import Club from "@/models/Club";
import FormResponse from "@/models/Response";
import User from "@/models/user";

const normalizeImage = (image) => (typeof image === "string" ? image.trim() : "");
const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const toObjectIdString = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.toString?.() || "";
};

export async function GET() {
  try {
    await connectDB();

    const clubs = await Club.find({ "activities.images.0": { $exists: true } })
      .select("clubName logo activities")
      .lean();

    const rankedActivities = clubs
      .flatMap((club) => {
        const activities = Array.isArray(club.activities) ? club.activities : [];

        return activities.map((activity, index) => {
          const images = Array.isArray(activity.images)
            ? activity.images.map(normalizeImage).filter(Boolean)
            : [];

          return {
            id: `${club._id}-${toObjectIdString(activity.formId) || index}`,
            title: activity.title || "Campus event",
            description: activity.description || "",
            date: activity.date || "",
            location: activity.location || "",
            participants: Number(activity.participants) || 0,
            image: images[0] || "",
            clubId: toObjectIdString(club._id),
            clubName: club.clubName || "Campus Club",
            clubLogo: normalizeImage(club.logo) || "/Defaultclublogo.svg",
            formId: toObjectIdString(activity.formId),
          };
        });
      })
      .filter((activity) => activity.image)
      .sort((a, b) => b.participants - a.participants)
      .slice(0, 3);

    const formIds = rankedActivities.map((activity) => activity.formId).filter(Boolean);
    const responses = formIds.length
      ? await FormResponse.find({ formId: { $in: formIds } })
          .select("formId userEmail submittedAt")
          .sort({ submittedAt: 1 })
          .lean()
      : [];

    const responsesByFormId = new Map();
    const participantEmails = new Set();

    responses.forEach((response) => {
      const formId = toObjectIdString(response.formId);
      const email = normalizeEmail(response.userEmail);
      if (!formId || !email) return;

      if (!responsesByFormId.has(formId)) responsesByFormId.set(formId, []);
      responsesByFormId.get(formId).push(email);
      participantEmails.add(email);
    });

    const users = participantEmails.size
      ? await User.find({ email: { $in: [...participantEmails] } })
          .select("email name img")
          .lean()
      : [];

    const userByEmail = new Map(users.map((user) => [normalizeEmail(user.email), user]));

    const events = rankedActivities.map((activity) => {
      const emails = responsesByFormId.get(activity.formId) || [];
      const participantAvatars = emails.slice(0, 3).map((email) => {
        const user = userByEmail.get(email);
        return {
          email,
          name: user?.name || email,
          image: normalizeImage(user?.img) || "/Profilepic.png",
        };
      });

      return {
        ...activity,
        responseParticipantCount: emails.length,
        participantAvatars,
      };
    });

    return Response.json({ events });
  } catch (error) {
    console.error("FETCH TRENDING CAMPUS ERROR:", error);
    return Response.json({ message: "Failed to fetch trending campus events" }, { status: 500 });
  }
}
