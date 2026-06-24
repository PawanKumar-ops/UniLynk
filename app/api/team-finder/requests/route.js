import { getServerSession } from "next-auth";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Form from "@/models/Form";
import Notification from "@/models/Notification";
import ResponseModel from "@/models/Response";
import User from "@/models/user";

const MAX_MESSAGE_LENGTH = 240;

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizeEmail = (email = "") => String(email).toLowerCase().trim();

const getDisplayName = (user, email) =>
  user?.name?.trim() || email.split("@")[0] || "A UniLynk member";

const getTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || "true") !== "false",
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
    },
  });

const getRecipientFromSoloResponse = (response) => ({
  name: response.teamFinder?.profile?.name || response.userEmail.split("@")[0],
  email: normalizeEmail(
    response.teamFinder?.profile?.email || response.userEmail,
  ),
});

const getRecipientFromTeamResponse = (response) => {
  const team = response.teamFinder?.team || {};
  const profile = response.teamFinder?.profile || {};
  const leadMember = Array.isArray(team.members) ? team.members[0] : null;

  return {
    name:
      team.lead ||
      profile.name ||
      leadMember?.name ||
      response.userEmail.split("@")[0],
    email: normalizeEmail(
      profile.email || leadMember?.email || response.userEmail,
    ),
    teamName: team.name || "your team",
  };
};

const buildEmail = ({
  recipient,
  senderName,
  senderEmail,
  formTitle,
  message,
  targetKind,
  teamName,
}) => {
  const hasMessage = Boolean(message.trim());
  const safeRecipientName = escapeHtml(recipient.name || "there");
  const safeSenderName = escapeHtml(senderName);
  const safeSenderEmail = escapeHtml(senderEmail);
  const safeFormTitle = escapeHtml(formTitle || "this event");
  const safeTeamName = escapeHtml(teamName || "your team");
  const safeMessage = escapeHtml(message.trim()).replace(/\n/g, "<br />");
  const plainMessage = hasMessage
    ? `\nMessage from ${senderName}:\n"${message.trim()}"\n`
    : "\nThey did not add a custom note, but they would like to connect about teaming up.\n";
  const requestLine =
    targetKind === "team"
      ? `${senderName} would like to join ${teamName || "your team"} for ${formTitle || "this event"}.`
      : `${senderName} would like to team up with you for ${formTitle || "this event"}.`;

  const html = `
    <!doctype html>
<html>
  <body style="margin:0;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#111827;">
  <div style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">
  You have received a new Team Finder request on Unilynk.
</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7f9;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;">

            <tr>
              <td style="padding:24px 28px 18px;border-bottom:1px solid #eef0f3;">
                <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;margin-bottom:8px;">
                  Unilynk Team Finder
                </div>

                <h1 style="font-size:22px;line-height:1.3;margin:0;color:#111827;font-weight:700;">
                  New Team Request
                </h1>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 28px;">

                <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
                  Hi ${safeRecipientName},
                </p>

                <p style="font-size:15px;line-height:1.6;margin:0 0 18px;">
                  ${escapeHtml(requestLine)}
                </p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0;border:1px solid #e5e7eb;border-radius:14px;background:#f9fafb;">
                  <tr>
                    <td style="padding:16px;">
                      <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">
                        From
                      </div>

                      <div style="font-size:15px;font-weight:700;color:#111827;">
                        ${safeSenderName}
                      </div>

                      <div style="font-size:13px;color:#4b5563;margin-top:2px;">
                        ${safeSenderEmail}
                      </div>
                    </td>
                  </tr>
                </table>

                <div style="font-size:12px;color:#6b7280;margin:0 0 8px;">
                  ${hasMessage ? "Message" : "Message"}
                </div>

                <div style="background:#f3f4f6;border-radius:12px;padding:16px 18px;margin-bottom:20px;">
                  <p style="font-size:15px;line-height:1.6;margin:0;color:#111827;">
                    ${hasMessage
      ? safeMessage
      : "No custom message was included with this request."
    }
                  </p>
                </div>

                <p style="font-size:14px;line-height:1.6;margin:0 0 14px;color:#4b5563;">
                  To accept this team request or add this user to your team, please visit <strong>Unilynk</strong> and manage your team from your account.
                </p>

                <p style="font-size:13px;line-height:1.6;margin:0;color:#6b7280;">
                  Please do not reply to this email. This is an automated notification and replies are not monitored.
                </p>

              </td>
            </tr>

            <tr>
              <td style="padding:18px 28px;background:#fafafa;border-top:1px solid #eef0f3;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">
                  This notification was sent because you are listed in Team Finder${targetKind === "team"
      ? ` as the lead for ${safeTeamName}`
      : ""
    }.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `Hi ${recipient.name || "there"},

${requestLine}

From: ${senderName} <${senderEmail}>
${plainMessage}

To accept this request or add this user to your team, please visit Unilynk.

Please do not reply to this email. This is an automated notification.

UniLynk Team Finder`;

  return { html, text };
};

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { formId, target, message = "" } = await req.json();
    const targetKind = target?.kind;
    const trimmedMessage = String(message || "")
      .trim()
      .slice(0, MAX_MESSAGE_LENGTH);

    if (!formId || !mongoose.Types.ObjectId.isValid(formId)) {
      return Response.json(
        { error: "A valid formId is required" },
        { status: 400 },
      );
    }

    if (!["users", "team"].includes(targetKind)) {
      return Response.json(
        { error: "A valid request target is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const senderEmail = normalizeEmail(session.user.email);
    const [sender, form] = await Promise.all([
      User.findOne({ email: senderEmail }, { name: 1 }).lean(),
      Form.findById(formId, { title: 1 }).lean(),
    ]);
    const senderName = getDisplayName(sender || session.user, senderEmail);
    const formTitle = form?.title || "this event";

    let recipients = [];
    let teamName = "";

    if (targetKind === "users") {
      const ids = Array.isArray(target?.userIds)
        ? target.userIds.filter((id) => mongoose.Types.ObjectId.isValid(id))
        : [];

      if (!ids.length) {
        return Response.json(
          { error: "Select at least one user" },
          { status: 400 },
        );
      }

      const responses = await ResponseModel.find({
        _id: { $in: ids },
        formId,
        "teamFinder.type": "solo",
      }).lean();

      recipients = responses.map(getRecipientFromSoloResponse);
    } else {
      const teamId = target?.teamId;

      if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
        return Response.json({ error: "Select a valid team" }, { status: 400 });
      }

      const response = await ResponseModel.findOne({
        _id: teamId,
        formId,
        "teamFinder.type": "team",
      }).lean();

      if (response) {
        const recipient = getRecipientFromTeamResponse(response);
        teamName = recipient.teamName;
        recipients = [recipient];
      }
    }

    recipients = recipients
      .filter((recipient) => recipient.email && recipient.email !== senderEmail)
      .filter(
        (recipient, index, arr) =>
          arr.findIndex((item) => item.email === recipient.email) === index,
      );

    if (!recipients.length) {
      return Response.json(
        { error: "No valid recipients found" },
        { status: 400 },
      );
    }

    const title =
      targetKind === "team"
        ? `${senderName} requested to join ${teamName}`
        : `${senderName} sent you a team request`;
    const body =
      targetKind === "team"
        ? `${senderName} wants to join your team for ${formTitle}.`
        : `${senderName} wants to team up for ${formTitle}.`;

    const senderId = sender?._id;

    const createdNotifications = await Notification.insertMany(
      recipients.map((recipient) => ({
        recipientEmail: recipient.email,
        senderEmail,
        senderName,
        senderId,
        type: "team-finder-request",
        title,
        body,
        message: trimmedMessage,
        formId,
        formTitle,
        targetKind,
        teamName,
      })),
    );

    try {
      const transporter = getTransporter();
      const fromAddress =
        process.env.EMAIL_FROM ||
        `"UniLynk" <${process.env.SMTP_USER || process.env.EMAIL}>`;

      await Promise.all(
        recipients.map((recipient) => {
          const { html, text } = buildEmail({
            recipient,
            senderName,
            senderEmail,
            formTitle,
            message: trimmedMessage,
            targetKind,
            teamName,
          });

          return transporter.sendMail({
            from: fromAddress,
            to: recipient.email,
            subject: `${senderName} wants to join your team on Unilynk`,
            text,
            html,
          });
        }),
      );
    } catch (emailError) {
      await Notification.deleteMany({
        _id: {
          $in: createdNotifications.map((notification) => notification._id),
        },
      });
      throw emailError;
    }

    if (targetKind === "team") {
      await ResponseModel.findOneAndUpdate(
        { formId, userEmail: senderEmail },
        {
          $set: {
            teamFinderRequest: {
              kind: "team",
              targetId: target.teamId,
              sentAt: new Date(),
            },
          },
          $setOnInsert: { answers: {}, isSubmitted: false, submittedAt: null },
        },
        { upsert: true, new: true, runValidators: true },
      );
    }

    return Response.json({ success: true, delivered: recipients.length });
  } catch (error) {
    console.error("TEAM FINDER REQUEST ERROR:", error);
    return Response.json(
      { error: "Could not deliver the request. Please try again." },
      { status: 500 },
    );
  }
}
