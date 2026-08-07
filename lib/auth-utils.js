import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const buckets = globalThis.__authRateLimitBuckets || new Map();
globalThis.__authRateLimitBuckets = buckets;

export function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function isValidEmail(email) {
  return EMAIL_REGEX.test(normalizeEmail(email));
}

export function validatePassword(password) {
  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    return "Password must be between 8 and 72 characters.";
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must include at least one letter and one number.";
  }
  return null;
}

export function getClientIp(req) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip") || "unknown";
}

export function rateLimit(key, { limit = 5, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (current.count >= limit) {
    return { ok: false, remaining: 0, resetAt: current.resetAt };
  }
  current.count += 1;
  return { ok: true, remaining: limit - current.count, resetAt: current.resetAt };
}

export function makeOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashOtp(email, otp, purpose) {
  if (!process.env.NEXTAUTH_SECRET) throw new Error("NEXTAUTH_SECRET is required");
  return crypto
    .createHmac("sha256", process.env.NEXTAUTH_SECRET)
    .update(`${normalizeEmail(email)}:${purpose}:${otp}`)
    .digest("hex");
}

export function signVerificationToken(email, purpose) {
  if (!process.env.NEXTAUTH_SECRET) throw new Error("NEXTAUTH_SECRET is required");
  return jwt.sign({ email: normalizeEmail(email), purpose, type: "otp_verified" }, process.env.NEXTAUTH_SECRET, {
    expiresIn: "10m",
  });
}

export function verifyVerificationToken(token, email, purpose) {
  if (!process.env.NEXTAUTH_SECRET) throw new Error("NEXTAUTH_SECRET is required");
  try {
    const payload = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    return payload?.type === "otp_verified" && payload?.purpose === purpose && payload?.email === normalizeEmail(email);
  } catch {
    return false;
  }
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}
