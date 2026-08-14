import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import { auth } from "@/auth";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim().slice(0, 80);
    const isTeamSearch = searchParams.get("scope") === "team";
    const limit = isTeamSearch ? 5 : Math.min(Number(searchParams.get("limit") || 8), 20);

    if (isTeamSearch) {
      const session = await auth();
      if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🚫 Block useless searches
    if (q.length < 2) {
      return Response.json(isTeamSearch ? { users: [] } : { results: [] });
    }

    const regex = new RegExp(`^${escapeRegex(q)}`, "i"); // prefix match = MUCH faster

    const userQuery = {
      $or: [
        { name: regex },
        { rollNumber: regex },
        { email: regex },
      ],
    };

    const clubQuery = {
      $or: [
        { name: regex },
        { code: regex },
      ],
    };

    // ⚡ Parallel execution
    if (isTeamSearch) {
      const users = await User.find(userQuery)
        .select("_id name rollNumber branch year img")
        .limit(5)
        .lean();
      return Response.json({
        users: users.map((user) => ({
          id: user._id.toString(), name: user.name || "Student", rollNumber: user.rollNumber || "",
          branch: user.branch || "General", year: user.year || "Student", img: user.img || "/Profilepic.png",
        })),
      });
    }

    const [users, clubs] = await Promise.all([
      User.find(userQuery)
        .select("_id name email img provider")
        .limit(limit)
        .lean(),

      User.db.collection("clubs")
        .find(clubQuery, {
          projection: { _id: 1, name: 1, image: 1 },
        })
        .limit(limit)
        .toArray(),
    ]);

    const results = [
      ...users.map((u) => ({
        id: u._id.toString(),
        type: "user",
        name: u.name,
        image: u.img || "/Profilepic.png",
        email: u.email,
        provider: u.provider,
      })),
      ...clubs.map((c) => ({
        id: c._id.toString(),
        type: "club",
        name: c.name,
        image: c.image || "/Defaultclublogo.svg",
      })),
    ].slice(0, limit);

    return Response.json({ results });
  } catch (err) {
    console.error("SEARCH ERROR:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
