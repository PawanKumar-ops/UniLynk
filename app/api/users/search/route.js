import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import Club from "@/models/Club";
import { auth } from "@/auth";
import { loreleiAvatar } from "@/lib/avatar";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Case-insensitive collation matching the `name` / `clubName` indexes.
const CI = { locale: "en", strength: 2 };
// Index-backed "starts with" match (fast path).
const prefixRange = (q) => ({ $gte: q, $lt: `${q}\uffff` });
// Cap for the slower "contains anywhere" fallback so it can never stall search.
const CONTAINS_MAX_MS = 1500;

const dedupe = (lists, limit) => {
  const seen = new Set();
  return lists.flat().filter((doc) => {
    const id = String(doc._id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  }).slice(0, limit);
};

/**
 * Starts-with matches come from indexes first; only if that doesn't fill
 * `limit` do we run the "contains anywhere" regex, excluding ids already found.
 */
async function searchUsers(q, limit, fields) {
  const lowerPrefix = new RegExp(`^${escapeRegex(q.toLowerCase())}`);
  const fast = dedupe(await Promise.all([
    User.find({ name: prefixRange(q) }).collation(CI).select(fields).limit(limit).lean(),
    User.find({ rollNumber: lowerPrefix }).select(fields).limit(limit).lean(),
    User.find({ email: lowerPrefix }).select(fields).limit(limit).lean(),
  ]), limit);
  if (fast.length >= limit) return fast;

  const contains = new RegExp(escapeRegex(q), "i");
  const more = await User.find({
    _id: { $nin: fast.map((u) => u._id) },
    $or: [{ name: contains }, { rollNumber: contains }, { email: contains }],
  }).select(fields).limit(limit - fast.length).maxTimeMS(CONTAINS_MAX_MS).lean().catch(() => []);
  return dedupe([fast, more], limit);
}

async function searchClubs(q, limit) {
  const fields = "_id clubName logo category memberCount";
  const fast = await Club.find({ clubName: prefixRange(q) }).collation(CI).select(fields).limit(limit).lean();
  if (fast.length >= limit) return fast;

  const contains = new RegExp(escapeRegex(q), "i");
  const more = await Club.find({
    _id: { $nin: fast.map((c) => c._id) },
    $or: [{ clubName: contains }, { category: contains }],
  }).select(fields).limit(limit - fast.length).maxTimeMS(CONTAINS_MAX_MS).lean().catch(() => []);
  return dedupe([fast, more], limit);
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim().replace(/\s+/g, " ").slice(0, 80);
    const isTeamSearch = searchParams.get("scope") === "team";
    const limit = isTeamSearch ? 5 : Math.min(Math.max(Number(searchParams.get("limit")) || 8, 1), 20);

    if (isTeamSearch) {
      const session = await auth();
      if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Block useless searches before touching the database.
    if (q.length < 2) {
      return Response.json(isTeamSearch ? { users: [] } : { results: [], users: [], clubs: [] });
    }

    await connectDB();

    if (isTeamSearch) {
      const users = await searchUsers(q, 5, "_id name email rollNumber branch year img");
      return Response.json({
        users: users.map((user) => ({
          id: user._id.toString(), name: user.name || "Student", rollNumber: user.rollNumber || "",
          branch: user.branch || "General", year: user.year || "Student", img: user.img || loreleiAvatar(user.email), email: user.email,
        })),
      });
    }

    // Users and clubs are searched in parallel.
    const [users, clubs] = await Promise.all([
      searchUsers(q, limit, "_id name email img provider"),
      searchClubs(q, limit),
    ]);

    const userResults = users.map((u) => ({
      id: u._id.toString(),
      type: "user",
      name: u.name || u.email?.split("@")[0] || "Student",
      image: u.img || loreleiAvatar(u.email),
      email: u.email,
      provider: u.provider,
    }));
    const clubResults = clubs.map((c) => ({
      id: c._id.toString(),
      type: "club",
      name: c.clubName,
      image: c.logo || "/Defaultclublogo.svg",
      category: c.category || "Club",
      memberCount: Number(c.memberCount) || 0,
    }));

    return Response.json(
      { results: [...userResults, ...clubResults], users: userResults, clubs: clubResults },
      { headers: { "Cache-Control": "private, max-age=30" } },
    );
  } catch (err) {
    console.error("SEARCH ERROR:", err);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
