import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";

const serializeNotification = (notification) => ({
  _id: notification._id.toString(),
  type: notification.type,
  title: notification.title,
  body: notification.body,
  message: notification.message,
  senderName: notification.senderName,
  senderEmail: notification.senderEmail,
  formId: notification.formId?.toString?.() || null,
  formTitle: notification.formTitle,
  targetKind: notification.targetKind,
  teamName: notification.teamName,
  createdAt: notification.createdAt,
});

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const notifications = await Notification.find({
      recipientEmail: session.user.email.toLowerCase().trim(),
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return Response.json(notifications.map(serializeNotification));
  } catch (error) {
    console.error("FETCH NOTIFICATIONS ERROR:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
