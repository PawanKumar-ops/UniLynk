import Club from "@/models/Club";

const DEFAULT_PROFILE_PICTURE = "/Profilepic.png";

export function normalizeEmail(email = "") {
  return String(email || "").trim().toLowerCase();
}

export function getFallbackNameFromEmail(email = "") {
  const localPart = String(email).split("@")[0]?.trim();
  return localPart || "Member";
}

export function getUserClubProfile(user = {}, email = "") {
  return {
    name: typeof user?.name === "string" && user.name.trim()
      ? user.name.trim()
      : getFallbackNameFromEmail(email || user?.email),
    profilePicture: typeof user?.img === "string" && user.img.trim()
      ? user.img.trim()
      : DEFAULT_PROFILE_PICTURE,
  };
}

export function getUniqueClubMemberCount(club = {}) {
  const emails = new Set();

  if (club.email) emails.add(normalizeEmail(club.email));

  (Array.isArray(club.leaders) ? club.leaders : []).forEach((leader) => {
    const email = normalizeEmail(leader?.email);
    if (email) emails.add(email);
  });

  (Array.isArray(club.members) ? club.members : []).forEach((member) => {
    const email = normalizeEmail(member?.email);
    if (email) emails.add(email);
  });

  return emails.size;
}

export async function syncUserClubProfile(user = {}) {
  const email = normalizeEmail(user?.email);
  if (!email) return;

  const profile = getUserClubProfile(user, email);

  await Club.updateMany(
    {
      $or: [
        { "members.email": email },
        { "leaders.email": email },
      ],
    },
    {
      $set: {
        "members.$[member].name": profile.name,
        "members.$[member].profilePicture": profile.profilePicture,
        "leaders.$[leader].image": profile.profilePicture,
      },
    },
    {
      arrayFilters: [
        { "member.email": email },
        { "leader.email": email },
      ],
    }
  );
}
