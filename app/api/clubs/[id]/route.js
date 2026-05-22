import { connectDB } from "@/lib/mongodb";
import Club from "@/models/Club";
import User from "@/models/user";

export async function GET(_req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

const club = await Club.findById(id).lean();
    if (!club) {
      return Response.json({ message: "Club not found" }, { status: 404 });
    }

    const leaderEmails = Array.isArray(club.leaders)
      ? club.leaders.map((leader) => leader.email).filter(Boolean)
      : [];

    const users = leaderEmails.length
      ? await User.find({ email: { $in: leaderEmails } }).select("email name img").lean()
      : [];

    const userMap = new Map(users.map((user) => [user.email?.toLowerCase(), user]));

    const leaders = (club.leaders || []).map((leader) => {
      const user = userMap.get(leader.email?.toLowerCase());
      return {
        email: leader.email,
        position: leader.position,
        image: leader.image || user?.img || "/Profilepic.png",
        name: user?.name || leader.email,
      };
    });

    return Response.json({
      club: {
        ...club,
        leaders,
      },
    });
  } catch (error) {
    console.error("FETCH CLUB BY ID ERROR:", error);
    return Response.json({ message: "Failed to fetch club" }, { status: 500 });
  }
}
