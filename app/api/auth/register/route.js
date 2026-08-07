import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import { getClientIp, hashPassword, isValidEmail, normalizeEmail, rateLimit, validatePassword, verifyVerificationToken } from "@/lib/auth-utils";

export async function POST(req) {
  try {
    const { email, password, verificationToken, skills = [] } = await req.json();
    const normalizedEmail = normalizeEmail(email);
    const passwordError = validatePassword(password);

    if (!isValidEmail(normalizedEmail) || passwordError) {
      return Response.json({ error: passwordError || "Enter a valid email address." }, { status: 400 });
    }
    if (!verifyVerificationToken(verificationToken, normalizedEmail, "register")) {
      return Response.json({ error: "Please verify your email before creating an account." }, { status: 403 });
    }

    const limited = rateLimit(`register:${getClientIp(req)}:${normalizedEmail}`, { limit: 5, windowMs: 60 * 60_000 });
    if (!limited.ok) return Response.json({ error: "Too many signup attempts. Please try again later." }, { status: 429 });

    await connectDB();
    if (await User.exists({ email: normalizedEmail })) {
      return Response.json({ error: "User already exists." }, { status: 409 });
    }

    const nitDomain = "@nitkkr.ac.in";
    const rollNumber = normalizedEmail.endsWith(nitDomain) ? normalizedEmail.slice(0, -nitDomain.length) : undefined;

    await User.create({
      email: normalizedEmail,
      password: await hashPassword(password),
      provider: "credentials",
      skills: Array.isArray(skills) ? skills.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean) : [],
      ...(rollNumber ? { rollNumber } : {}),
    });

    return Response.json({ success: true, message: "User created successfully." }, { status: 201 });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return Response.json({ error: "Unable to create account right now." }, { status: 500 });
  }
}
