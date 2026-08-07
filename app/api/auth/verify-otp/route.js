import OTP from "@/models/OTP";
import { connectDB } from "@/lib/mongodb";
import { getClientIp, hashOtp, isValidEmail, normalizeEmail, rateLimit, signVerificationToken } from "@/lib/auth-utils";

const PURPOSES = new Set(["register", "login", "reset"]);

export async function POST(req) {
  try {
    const { email, otp, purpose } = await req.json();
    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail) || !/^\d{6}$/.test(String(otp || "")) || !PURPOSES.has(purpose)) {
      return Response.json({ error: "Enter a valid 6-digit code." }, { status: 400 });
    }

    const limited = rateLimit(`verify:${getClientIp(req)}:${normalizedEmail}:${purpose}`, { limit: 6, windowMs: 15 * 60_000 });
    if (!limited.ok) return Response.json({ error: "Too many verification attempts. Please request a new code later." }, { status: 429 });

    await connectDB();
    const record = await OTP.findOne({ email: normalizedEmail, purpose });
    if (!record || record.expiresAt < new Date()) {
      await OTP.deleteMany({ email: normalizedEmail, purpose, expiresAt: { $lt: new Date() } });
      return Response.json({ error: "Code expired or invalid." }, { status: 400 });
    }

    if (record.attempts >= 5 || record.otpHash !== hashOtp(normalizedEmail, otp, purpose)) {
      await OTP.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
      return Response.json({ error: "Code expired or invalid." }, { status: 400 });
    }

    await OTP.deleteMany({ email: normalizedEmail, purpose });
    return Response.json({ success: true, verificationToken: signVerificationToken(normalizedEmail, purpose) });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    return Response.json({ error: "Unable to verify code right now." }, { status: 500 });
  }
}
