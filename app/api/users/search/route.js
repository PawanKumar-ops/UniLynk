import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const limit = Math.min(Number(searchParams.get("limit") || 8), 20);

    // 🚫 Block useless searches
    if (q.length < 2) {
      return Response.json({ results: [] });
    }

    const regex = new RegExp(`^${q}`, "i"); // prefix match = MUCH faster

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
