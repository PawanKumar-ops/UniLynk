import OTP from "@/models/OTP";
import User from "@/models/user";
import { connectDB } from "@/lib/mongodb";
import { getClientIp, hashOtp, isValidEmail, makeOtp, normalizeEmail, rateLimit } from "@/lib/auth-utils";
import { sendOtpEmail } from "@/lib/mail";

const PURPOSES = new Set(["register", "login", "reset"]);

export async function POST(req) {
  try {
    const { email, purpose } = await req.json();
    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail) || !PURPOSES.has(purpose)) {
      return Response.json({ error: "Enter a valid email and OTP purpose." }, { status: 400 });
    }

    const limited = rateLimit(`otp:${getClientIp(req)}:${normalizedEmail}:${purpose}`, { limit: 3, windowMs: 15 * 60_000 });
    if (!limited.ok) return Response.json({ error: "Too many OTP requests. Please try again later." }, { status: 429 });

    await connectDB();
    const existingUser = await User.findOne({ email: normalizedEmail }).select("_id password").lean();
    if (purpose === "register" && existingUser) return Response.json({ error: "An account already exists for this email." }, { status: 409 });
    if ((purpose === "reset" || purpose === "login") && !existingUser) return Response.json({ error: "No account exists for this email." }, { status: 404 });

    const recentOtp = await OTP.findOne({ email: normalizedEmail, purpose }).sort({ createdAt: -1 }).lean();
    if (recentOtp && Date.now() - new Date(recentOtp.createdAt).getTime() < 60_000) {
      return Response.json({ error: "Please wait 60 seconds before requesting another code." }, { status: 429 });
    }

    const otp = makeOtp();
    await OTP.deleteMany({ email: normalizedEmail, purpose });
    await OTP.create({ email: normalizedEmail, otpHash: hashOtp(normalizedEmail, otp, purpose), purpose, expiresAt: new Date(Date.now() + 5 * 60_000) });
    await sendOtpEmail({ to: normalizedEmail, otp, purpose });

    return Response.json({ success: true, message: "Verification code sent." });
  } catch (error) {
    console.error("SEND OTP ERROR:", error);
    return Response.json({ error: "Unable to send verification code right now." }, { status: 500 });
  }
}
