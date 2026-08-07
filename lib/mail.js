import nodemailer from "nodemailer";

export async function sendOtpEmail({ to, otp, purpose }) {
  if (!process.env.EMAIL || !process.env.EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT || 465),
    secure: String(process.env.EMAIL_SECURE || "true") === "true",
    auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASS },
  });

  const subject = purpose === "reset" ? "Reset your UniLynk password" : "Verify your UniLynk email";
  const action = purpose === "reset" ? "reset your password" : "finish creating your account";

  await transporter.sendMail({
    from: `"UniLynk" <${process.env.EMAIL}>`,
    to,
    subject,
    text: `Use ${otp} to ${action}. This code expires in 5 minutes. If you did not request this, ignore this email.`,
  });
}
