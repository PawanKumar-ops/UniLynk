import { connectDB } from "@/lib/mongodb";
import Club from "@/models/Club";
import User from "@/models/user";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getFallbackNameFromEmail = (email = "") => {
  const localPart = String(email).split("@")[0]?.trim();
  return localPart || "Member";
};

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

export async function PATCH(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;
    const club = await Club.findById(id);

    if (!club) {
      return Response.json({ message: "Club not found" }, { status: 404 });
    }

    const body = await req.json();
    const incomingEmails = Array.isArray(body?.members) ? body.members : [];

    const normalizedEmails = [...new Set(
      incomingEmails
        .map((value) => String(value || "").trim().toLowerCase())
        .filter((email) => EMAIL_RE.test(email))
    )];

    if (normalizedEmails.length === 0) {
      return Response.json({ message: "No valid member emails provided" }, { status: 400 });
    }

    const users = await User.find({ email: { $in: normalizedEmails } })
      .select("email name img")
      .lean();
    const userMap = new Map(users.map((user) => [user.email?.toLowerCase(), user]));

    const existingMembers = Array.isArray(club.members) ? club.members : [];
    const existingEmails = new Set(existingMembers.map((member) => member.email?.toLowerCase()));

    const newMembers = normalizedEmails
      .filter((email) => !existingEmails.has(email))
      .map((email) => {
        const user = userMap.get(email);
        return {
          email,
          name: user?.name?.trim() || getFallbackNameFromEmail(email),
          profilePicture: user?.img || "/Profilepic.png",
        };
      });

    if (newMembers.length === 0) {
      return Response.json({
        club,
        addedCount: 0,
        message: "All members already exist",
      });
    }

    club.members = [...existingMembers, ...newMembers];
    club.memberCount = club.members.length;
    await club.save();

    return Response.json({
      club,
      addedCount: newMembers.length,
      message: "Members added successfully",
    });
  } catch (error) {
    console.error("ADD CLUB MEMBERS ERROR:", error);
    return Response.json({ message: "Failed to add members" }, { status: 500 });
  }
}
