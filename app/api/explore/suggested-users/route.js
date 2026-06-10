import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import { normalizeEmail } from "@/lib/clubProfileSync";
import Club from "@/models/Club";
import User from "@/models/user";

const SUGGESTION_LIMIT = 4;

const buildJsonResponse = (body, init = {}) => {
  const headers = new Headers(init.headers || {});
  headers.set("Cache-Control", "no-store, max-age=0");

  return Response.json(body, { ...init, headers });
};

const normalizeText = (value) => String(value || "").trim();

const getUserRole = (user = {}) => {
  const year = normalizeText(user.year);
  const branch = normalizeText(user.branch);

  if (year && branch) return `${year} · ${branch}`;
  return year || branch || "UniLynk student";
};

const toSuggestion = (user, sharedClubCounts = new Map()) => ({
  id: user._id?.toString?.() || String(user._id),
  name: normalizeText(user.name) || normalizeEmail(user.email) || "UniLynk User",
  role: getUserRole(user),
  avatar: normalizeText(user.img) || "/Profilepic.png",
  mutual: sharedClubCounts.get(normalizeEmail(user.email)) || 0,
});

const collectClubEmails = (club = {}) => {
  const emails = [club.email];

  if (Array.isArray(club.leaders)) {
    emails.push(...club.leaders.map((leader) => leader?.email));
  }

  if (Array.isArray(club.members)) {
    emails.push(...club.members.map((member) => member?.email));
  }

  return emails.map(normalizeEmail).filter(Boolean);
};

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return buildJsonResponse({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const currentEmail = normalizeEmail(session.user.email);
    const currentUser = await User.findOne({ email: currentEmail })
      .select("_id email year branch")
      .lean();

    if (!currentUser) {
      return buildJsonResponse({ message: "User not found" }, { status: 404 });
    }

    const currentYear = normalizeText(currentUser.year);
    const currentBranch = normalizeText(currentUser.branch);

    const currentUserClubs = await Club.find({
      $or: [
        { email: currentEmail },
        { "leaders.email": currentEmail },
        { "members.email": currentEmail },
      ],
    })
      .select("email leaders.email members.email")
      .lean();

    const sharedClubCounts = currentUserClubs.reduce((counts, club) => {
      collectClubEmails(club).forEach((email) => {
        if (email !== currentEmail) counts.set(email, (counts.get(email) || 0) + 1);
      });

      return counts;
    }, new Map());
    const sharedClubEmails = new Set(sharedClubCounts.keys());

    const suggestions = [];
    const selectedIds = new Set([currentUser._id.toString()]);
    const selectedObjectIds = [currentUser._id];

    const addUsers = (users = []) => {
      for (const user of users) {
        const id = user._id?.toString?.() || String(user._id);
        const email = normalizeEmail(user.email);

        if (!id || selectedIds.has(id) || email === currentEmail) continue;

        suggestions.push(toSuggestion(user, sharedClubCounts));
        selectedIds.add(id);
        selectedObjectIds.push(user._id);

        if (suggestions.length >= SUGGESTION_LIMIT) break;
      }
    };

    const baseFilter = () => ({
      _id: { $nin: selectedObjectIds },
      email: { $ne: currentEmail },
    });

    const fetchUsers = async (filter) => {
      const remainingSlots = SUGGESTION_LIMIT - suggestions.length;
      if (remainingSlots <= 0) return [];

      return User.aggregate([
        { $match: { ...baseFilter(), ...filter } },
        { $sample: { size: remainingSlots } },
        { $project: { _id: 1, email: 1, name: 1, img: 1, year: 1, branch: 1 } },
      ]);
    };

    // Fill four cards in priority order: same year/branch, same year/different branch,
    // shared club plus same year, shared club, then any other user as a fallback. Each
    // bucket is sampled randomly so section and page refreshes can surface new people.
    if (currentYear && currentBranch) {
      addUsers(await fetchUsers({ year: currentYear, branch: currentBranch }));
    }

    if (suggestions.length < SUGGESTION_LIMIT && currentYear) {
      addUsers(await fetchUsers({ year: currentYear, branch: { $ne: currentBranch } }));
    }

    if (suggestions.length < SUGGESTION_LIMIT && sharedClubEmails.size && currentYear) {
      addUsers(await fetchUsers({ email: { $in: [...sharedClubEmails] }, year: currentYear }));
    }

    if (suggestions.length < SUGGESTION_LIMIT && sharedClubEmails.size) {
      addUsers(await fetchUsers({ email: { $in: [...sharedClubEmails] } }));
    }

    if (suggestions.length < SUGGESTION_LIMIT) {
      addUsers(await fetchUsers({}));
    }

    return buildJsonResponse({ users: suggestions.slice(0, SUGGESTION_LIMIT) }, { status: 200 });
  } catch (error) {
    console.error("FETCH SUGGESTED USERS ERROR:", error);
    return buildJsonResponse({ message: "Failed to fetch suggested users" }, { status: 500 });
  }
}
