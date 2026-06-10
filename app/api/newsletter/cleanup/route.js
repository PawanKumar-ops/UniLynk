import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { cleanupExpiredNewsletters } from "@/lib/newsletterCleanup";

export const dynamic = "force-dynamic";

const isAuthorizedCleanupRequest = (req) => {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authHeader = req.headers.get("authorization") || "";
  return authHeader === `Bearer ${cronSecret}`;
};

export async function GET(req) {
  if (!isAuthorizedCleanupRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const result = await cleanupExpiredNewsletters(new Date());
    return NextResponse.json(result);
  } catch (error) {
    console.error("NEWSLETTER CLEANUP ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
