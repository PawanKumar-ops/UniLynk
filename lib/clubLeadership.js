const normalize = (email) => String(email || "").toLowerCase().trim();
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Positions on the members list that are ordinary membership, not leadership.
const NON_LEADERSHIP_POSITIONS = new Set(["", "member", "members", "general member"]);

// Keep identity resolution in one place for routes that check club leadership.
// The current account model uses email as its stable club identity.
export async function getUserIdentities(email) {
  const identity = normalize(email);
  return identity ? [identity] : [];
}

export function isLeadershipPosition(position) {
  return !NON_LEADERSHIP_POSITIONS.has(String(position || "").toLowerCase().trim());
}

/** Mongo filter for every club where the email is on the leadership team. */
export function leadershipClubFilter(email) {
  const pattern = new RegExp(`^\\s*${escapeRegex(normalize(email))}\\s*$`, "i");
  return {
    $or: [
      { "leaders.email": pattern },
      { members: { $elemMatch: { email: pattern, position: { $nin: [null, ...NON_LEADERSHIP_POSITIONS], $not: /^\s*members?\s*$/i } } } },
    ],
  };
}

/** True when the email is a leader, or a member holding a leadership position. */
export function isClubLeader(club, email) {
  const identities = Array.isArray(email) ? email : [email];
  const targets = new Set(identities.map(normalize).filter(Boolean));
  if (!targets.size) return false;
  if ((club?.leaders || []).some((l) => targets.has(normalize(l?.email)))) return true;
  return (club?.members || []).some(
    (m) => targets.has(normalize(m?.email)) && isLeadershipPosition(m?.position),
  );
}
