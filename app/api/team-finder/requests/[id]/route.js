import { getServerSession } from "next-auth";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import ResponseModel from "@/models/Response";
import User from "@/models/user";

const normalizeEmail = (email = "") => String(email || "").toLowerCase().trim();

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

const memberFromUser = (user, fallbackEmail) => ({
  name: user?.name || fallbackEmail.split("@")[0] || "Participant",
  email: user?.email || fallbackEmail,
  year: user?.year || "",
  branch: user?.branch || "",
  rollNo: user?.rollNumber || "",
  img: user?.img || null,
});

const buildDecisionEmail = ({ accepted, recipientName, formTitle, teamName }) => {
  const decision = accepted ? "accepted" : "declined";
  const sentence = accepted
    ? `Your request is accepted for the team${teamName ? ` ${teamName}` : ""} for ${formTitle || "this event"}.`
    : `Your Request is declined for this event.`;

  return {
    subject: `Your team request was ${decision} on UniLynk`,
    text: `Hi ${recipientName || "there"},\n\n${sentence}\n\nUniLynk Team Finder`,
    html: `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111827;background:#f6f7f9;margin:0;padding:24px;"><div style="max-width:560px;margin:auto;background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:28px;"><p style="margin:0 0 16px;">Hi ${recipientName || "there"},</p><p style="margin:0 0 18px;line-height:1.6;">${sentence}</p><p style="margin:0;color:#6b7280;font-size:13px;">UniLynk Team Finder</p></div></body></html>`,
  };
};

export async function PATCH(req, context) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const { action } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id) || !["accept", "decline"].includes(action)) {
      return Response.json({ error: "Invalid request decision" }, { status: 400 });
    }

    await connectDB();

    const recipientEmail = normalizeEmail(session.user.email);
    const requestNotification = await Notification.findOne({
      _id: id,
      recipientEmail,
      type: "team-finder-request",
    }).lean();

    if (!requestNotification) {
      return Response.json({ error: "Team request not found" }, { status: 404 });
    }

    const requesterEmail = normalizeEmail(requestNotification.senderEmail);
    if (!requesterEmail) {
      return Response.json({ error: "Requester email missing" }, { status: 400 });
    }

    const accepted = action === "accept";
    let targetResponse = null;

    if (accepted) {
      const requesterUser = await User.findOne(
        { email: requesterEmail },
        { name: 1, email: 1, year: 1, branch: 1, rollNumber: 1, img: 1 },
      ).lean();
      const newMember = memberFromUser(requesterUser, requesterEmail);
      const targetQuery = requestNotification.targetResponseId
        ? { _id: requestNotification.targetResponseId }
        : {
            formId: requestNotification.formId,
            userEmail: recipientEmail,
            "teamFinder.type": "team",
          };

      targetResponse = await ResponseModel.findOne(targetQuery);

      if (!targetResponse) {
        return Response.json({ error: "Team registration not found" }, { status: 404 });
      }

      const teamMembers = Array.isArray(targetResponse.teamFinder?.team?.members)
        ? targetResponse.teamFinder.team.members
        : [];
      const alreadyInTeam = teamMembers.some(
        (member) => normalizeEmail(member?.email) === requesterEmail,
      );

      if (!alreadyInTeam) {
        teamMembers.push(newMember);
      }

      const total = Number(targetResponse.teamFinder?.team?.total) || teamMembers.length;
      targetResponse.set("teamFinder.team.members", teamMembers);
      targetResponse.set("teamFinder.team.needed", Math.max(total - teamMembers.length, 0));

      const registration = targetResponse.answers?.teamRegistration;
      if (registration && Array.isArray(registration.members)) {
        const registrationMembers = registration.members;
        if (!registrationMembers.some((member) => normalizeEmail(member?.email) === requesterEmail)) {
          registrationMembers.push(newMember);
          targetResponse.set("answers.teamRegistration.members", registrationMembers);
        }
      }

      await targetResponse.save();

      await ResponseModel.findOneAndUpdate(
        { formId: requestNotification.formId, userEmail: requesterEmail },
        {
          $set: {
            teamFinderRequest: {
              kind: "team",
              targetId: targetResponse._id.toString(),
              sentAt: requestNotification.createdAt,
              status: "accepted",
              decidedAt: new Date(),
            },
          },
          $unset: { teamFinder: "" },
          $setOnInsert: { answers: {}, isSubmitted: false, submittedAt: null },
        },
        { upsert: true, new: true, runValidators: true },
      );
    } else {
      await ResponseModel.findOneAndUpdate(
        { formId: requestNotification.formId, userEmail: requesterEmail },
        {
          $set: {
            "teamFinderRequest.status": "declined",
            "teamFinderRequest.decidedAt": new Date(),
          },
        },
      );
    }

    const requesterUser = await User.findOne({ email: requesterEmail }, { name: 1 }).lean();
    const title = accepted ? "Your team request was accepted" : "Your team request was declined";
    const body = accepted
      ? `Your request is accepted for the team${requestNotification.teamName ? ` ${requestNotification.teamName}` : ""}.`
      : "Your Request is declined for this event";

    await Notification.create({
      recipientEmail: requesterEmail,
      senderEmail: recipientEmail,
      senderName: session.user.name || recipientEmail,
      type: accepted ? "team-finder-accepted" : "team-finder-declined",
      title,
      body,
      formId: requestNotification.formId,
      formTitle: requestNotification.formTitle,
      targetKind: requestNotification.targetKind,
      teamName: requestNotification.teamName,
    });

    const { subject, text, html } = buildDecisionEmail({
      accepted,
      recipientName: requesterUser?.name || requestNotification.senderName,
      formTitle: requestNotification.formTitle,
      teamName: requestNotification.teamName,
    });

    const transporter = getTransporter();
    const from = process.env.EMAIL_FROM || `"UniLynk" <${process.env.SMTP_USER || process.env.EMAIL}>`;
    await transporter.sendMail({ from, to: requesterEmail, subject, text, html });

    await Notification.deleteOne({ _id: requestNotification._id });

    return Response.json({ success: true, action, teamId: targetResponse?._id?.toString() || null });
  } catch (error) {
    console.error("TEAM FINDER DECISION ERROR:", error);
    return Response.json({ error: "Could not update this team request. Please try again." }, { status: 500 });
  }
}
