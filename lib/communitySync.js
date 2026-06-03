import Club from "@/models/Club";
import Community from "@/models/Community";
import User from "@/models/user";

function normalizeEmail(email = "") {
  return String(email || "").toLowerCase().trim();
}

function uniqueIds(values = []) {
  const seen = new Set();
  return values
    .filter(Boolean)
    .map((value) => String(value))
    .filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

function getClubEmails(club) {
  return [
    club.email,
    ...(club.leaders || []).map((leader) => leader.email),
    ...(club.members || []).map((member) => member.email),
  ]
    .map(normalizeEmail)
    .filter(Boolean);
}

function isClubAdminEmail(club, email) {
  const normalizedEmail = normalizeEmail(email);
  return (
    normalizedEmail === normalizeEmail(club.email) ||
    (club.leaders || []).some((leader) => normalizeEmail(leader.email) === normalizedEmail)
  );
}

export async function syncClubCommunity(clubOrId, fallbackUserId = null) {
  const club = typeof clubOrId === "string" ? await Club.findById(clubOrId).lean() : clubOrId;
  if (!club?._id) return null;

  const memberEmails = [...new Set(getClubEmails(club))];
  const users = memberEmails.length
    ? await User.find({ email: { $in: memberEmails } }).select("_id email").lean()
    : [];

  const memberIds = uniqueIds(users.map((user) => user._id));
  if (!memberIds.length && fallbackUserId) memberIds.push(String(fallbackUserId));

  const adminIds = uniqueIds(
    users.filter((user) => isClubAdminEmail(club, user.email)).map((user) => user._id)
  );
  if (!adminIds.length && fallbackUserId) adminIds.push(String(fallbackUserId));

  if (!memberIds.length || !adminIds.length) return null;

  const communityDefaults = {
    name: `${club.clubName} Community`,
    description: club.description || `Community chat for ${club.clubName}`,
    image: club.logo || club.banner || "",
  };

  const existing = await Community.findOne({ clubId: club._id });
  if (!existing) {
    return Community.create({
      ...communityDefaults,
      clubId: club._id,
      admins: adminIds,
      members: memberIds,
      groups: [
        {
          name: "Announcements",
          description: "Important updates from club admins",
          isAnnouncement: true,
          createdBy: adminIds[0],
          members: memberIds,
        },
        {
          name: "General",
          description: "Chat with everyone in the club",
          createdBy: adminIds[0],
          members: memberIds,
        },
      ],
    });
  }

  existing.name = communityDefaults.name;
  existing.description = communityDefaults.description;
  existing.image = communityDefaults.image;
  existing.members = uniqueIds([...existing.members, ...memberIds]);
  existing.admins = uniqueIds([...existing.admins, ...adminIds]);

  if (!existing.groups?.length) {
    existing.groups = [
      {
        name: "Announcements",
        description: "Important updates from club admins",
        isAnnouncement: true,
        createdBy: existing.admins[0],
        members: existing.members,
      },
      {
        name: "General",
        description: "Chat with everyone in the club",
        createdBy: existing.admins[0],
        members: existing.members,
      },
    ];
  } else {
    existing.groups.forEach((group) => {
      if (group.isAnnouncement || group.name === "General") {
        group.members = uniqueIds([...group.members, ...memberIds]);
      }
    });
  }

  return existing.save();
}

export async function syncClubCommunitiesForUser(user) {
  const userEmail = normalizeEmail(user?.email);
  if (!userEmail) return;

  const clubs = await Club.find({
    $or: [
      { email: userEmail },
      { "leaders.email": userEmail },
      { "members.email": userEmail },
    ],
  }).lean();

  await Promise.all(clubs.map((club) => syncClubCommunity(club, user?._id)));
}
