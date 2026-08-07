import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import { getClientIp, hashPassword, isValidEmail, normalizeEmail, rateLimit, validatePassword, verifyVerificationToken } from "@/lib/auth-utils";

export async function POST(req) {
  try {
    const { email, password, verificationToken } = await req.json();
    const normalizedEmail = normalizeEmail(email);
    const passwordError = validatePassword(password);

    if (!isValidEmail(normalizedEmail) || passwordError) {
      return Response.json({ error: passwordError || "Enter a valid email address." }, { status: 400 });
    }
    if (!verifyVerificationToken(verificationToken, normalizedEmail, "reset")) {
      return Response.json({ error: "Please verify your reset code before changing your password." }, { status: 403 });
    }

    const limited = rateLimit(`reset:${getClientIp(req)}:${normalizedEmail}`, { limit: 5, windowMs: 60 * 60_000 });
    if (!limited.ok) return Response.json({ error: "Too many reset attempts. Please try again later." }, { status: 429 });

    await connectDB();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return Response.json({ error: "No account exists for this email." }, { status: 404 });

    user.password = await hashPassword(password);
    user.provider = user.provider || "credentials";
    await user.save();

    return Response.json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return Response.json({ error: "Unable to reset password right now." }, { status: 500 });
  }
}
