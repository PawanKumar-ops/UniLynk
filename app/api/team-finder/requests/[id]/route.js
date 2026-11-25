import { auth } from "@/auth";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
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
  const session = await auth();

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
    if (requestNotification.targetKind === "users" && recipientEmail === requesterEmail) {
      return Response.json({ error: "The invite recipient must accept their own invite." }, { status: 403 });
    }

    const accepted = action === "accept";
    let targetResponse = null;
    // Join requests explicitly target a team response. Other requests are
    // member invitations; do not infer this from the recipient's profile.
    const memberInvite = requestNotification.targetKind === "users";

    if (accepted) {
      let requesterTeam = null;
      if (memberInvite) {
        requesterTeam = await ResponseModel.findOne({
          formId: requestNotification.formId,
          userEmail: requesterEmail,
          "teamFinder.type": "team",
        });
        if (!requesterTeam) {
          const teamLead = await User.findOne({ email: requesterEmail }, { name: 1, email: 1, year: 1, branch: 1, rollNumber: 1, img: 1 }).lean();
          const lead = memberFromUser(teamLead, requesterEmail);
          const capacity = 4;
          requesterTeam = await ResponseModel.findOneAndUpdate(
            { formId: requestNotification.formId, userEmail: requesterEmail },
            {
              $set: {
                teamFinder: {
                  type: "team",
                  profile: { name: lead.name, email: requesterEmail },
                  team: {
                    name: requestNotification.teamName || `${lead.name}'s Team`,
                    lead: lead.name,
                    members: [lead],
                    total: capacity,
                    needed: capacity - 1,
                    lookingFor: [],
                  },
                  addedAt: new Date(),
                },
              },
              $setOnInsert: { answers: {}, isSubmitted: false, submittedAt: null },
            },
            { upsert: true, new: true, runValidators: true },
          );
        }
        targetResponse = requesterTeam;
      }

      let requesterUser = null;
      if (!memberInvite) {
        requesterUser = await User.findOne(
          { email: requesterEmail },
          { name: 1, email: 1, year: 1, branch: 1, rollNumber: 1, img: 1 },
        ).lean();
      }
      if (!memberInvite && requestNotification.targetResponseId) {
        targetResponse = await ResponseModel.findOne({
          _id: requestNotification.targetResponseId,
          formId: requestNotification.formId,
          userEmail: recipientEmail,
          "teamFinder.type": "team",
        });
      }
      // Resolve by the lead's event response when an older notification has a
      // missing, stale, or incorrect targetResponseId.
      if (!targetResponse && !memberInvite && !requestNotification.targetKind) {
        targetResponse = await ResponseModel.findOne({
          formId: requestNotification.formId,
          userEmail: recipientEmail,
          "teamFinder.type": "team",
        });
      }

      // Older deployments stored only the response ID on the notification. If
      // it points to the lead's event response, convert that response into the
      // TeamFinder team without requiring a new registration.
      if (!targetResponse && !memberInvite && !requestNotification.targetKind) {
        const leadUser = await User.findOne({ email: recipientEmail }, { name: 1, email: 1, year: 1, branch: 1, img: 1, rollNumber: 1 }).lean();
        const lead = memberFromUser(leadUser, recipientEmail);
        const formResponse = await ResponseModel.findOne({ formId: requestNotification.formId, userEmail: recipientEmail });
        const existingTeamMembers = Array.isArray(formResponse?.teamFinder?.team?.members) ? formResponse.teamFinder.team.members : [];
        const registeredMembers = Array.isArray(formResponse?.answers?.team) ? formResponse.answers.team : [];
        const capacity = Math.max(1, Number(formResponse?.teamFinder?.team?.total) || 4);
        const members = [lead, ...existingTeamMembers.filter((member) => normalizeEmail(member?.email) !== recipientEmail)];
        for (const member of registeredMembers) {
          if (!members.some((existing) => normalizeEmail(existing?.email) === normalizeEmail(member?.email))) members.push(member);
        }
        const teamDocument = formResponse || new ResponseModel({
          formId: requestNotification.formId,
          userEmail: recipientEmail,
          answers: {},
          isSubmitted: false,
          submittedAt: null,
        });
        teamDocument.set("teamFinder", {
          type: "team",
          profile: { name: lead.name, email: recipientEmail },
          team: {
            name: teamDocument.answers?.teamName || requestNotification.teamName || `${lead.name}'s Team`,
            lead: lead.name,
            members,
            total: capacity,
            needed: Math.max(capacity - members.length, 0),
            lookingFor: [],
          },
          addedAt: new Date(),
        });
        targetResponse = teamDocument;
      }
      if (!targetResponse && requestNotification.targetKind === "team") {
        const registrationLead = await User.findOne({ email: recipientEmail }, { name: 1, email: 1, year: 1, branch: 1, rollNumber: 1, img: 1 }).lean();
        const leadMember = memberFromUser(registrationLead, recipientEmail);
        const capacity = 4;
        const teamResponse = await ResponseModel.findOneAndUpdate(
          { formId: requestNotification.formId, userEmail: recipientEmail },
          {
            $set: {
              teamFinder: {
                type: "team",
                profile: { name: leadMember.name, email: recipientEmail },
                team: {
                  name: requestNotification.teamName || `${leadMember.name}'s Team`,
                  lead: leadMember.name,
                  members: [leadMember],
                  total: capacity,
                  needed: capacity - 1,
                  lookingFor: [],
                },
                addedAt: new Date(),
              },
            },
            $setOnInsert: { answers: {}, isSubmitted: false, submittedAt: null },
          },
          { upsert: true, new: true, runValidators: true },
        );
        if (teamResponse) {
          targetResponse = teamResponse;
        } else {
          targetResponse = new ResponseModel({
            formId: requestNotification.formId,
            userEmail: recipientEmail,
            answers: {},
            isSubmitted: false,
            submittedAt: null,
            teamFinder: {
              type: "team",
              profile: { name: leadMember.name, email: recipientEmail },
              team: { name: requestNotification.teamName || `${leadMember.name}'s Team`, lead: leadMember.name, members: [leadMember], total: capacity, needed: capacity - 1, lookingFor: [] },
              addedAt: new Date(),
            },
          });
        }
      }
      if (!targetResponse) {
        return Response.json({ error: "Team registration not found for this request type" }, { status: 404 });
      }

      const teamMembers = Array.isArray(targetResponse.teamFinder?.team?.members)
        ? targetResponse.teamFinder.team.members
        : [];
      const acceptedUserEmail = memberInvite ? recipientEmail : requesterEmail;
      const acceptedUser = requesterTeam
        ? await User.findOne({ email: recipientEmail }, { name: 1, email: 1, year: 1, branch: 1, rollNumber: 1, img: 1 }).lean()
        : requesterUser;
      const acceptedMember = memberFromUser(acceptedUser, acceptedUserEmail);
      const alreadyInTeam = teamMembers.some((member) => normalizeEmail(member?.email) === acceptedUserEmail);
      const total = Math.max(1, Number(targetResponse.teamFinder?.team?.total) || 4);

      if (!alreadyInTeam) {
        if (teamMembers.length >= total) {
          return Response.json({ error: "This team is already full" }, { status: 409 });
        }
        teamMembers.push(acceptedMember);
      }

      targetResponse.set("teamFinder.team.members", teamMembers);
      targetResponse.set("teamFinder.team.needed", Math.max(total - teamMembers.length, 0));

      // EventAnalytics reads registered team rosters from answers.teamRegistration.
      // Keep that roster aligned with TeamFinder when a request is accepted.
      const registration = targetResponse.answers?.teamRegistration || {};
      const registrationMembers = Array.isArray(registration.members) ? registration.members : [];
      if (!registrationMembers.some((member) => normalizeEmail(member?.email) === acceptedUserEmail)) {
        registrationMembers.push(acceptedMember);
      }
      targetResponse.set("answers.teamRegistration", {
        ...registration,
        teamName: registration.teamName || targetResponse.teamFinder?.team?.name || "",
        members: registrationMembers,
      });

      await targetResponse.save();

      const acceptedRequester = await ResponseModel.findOne({ formId: requestNotification.formId, userEmail: requesterEmail });
      if (acceptedRequester) {
        acceptedRequester.set("teamFinderRequest", {
          kind: "team",
          targetId: targetResponse._id.toString(),
          sentAt: requestNotification.createdAt,
          status: "accepted",
          decidedAt: new Date(),
        });
        acceptedRequester.set("teamFinder", undefined);
        await acceptedRequester.save();
      }
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
      targetKind: requestNotification.targetKind || (memberInvite ? "users" : "team"),
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
