const normalize = (email) => String(email || "").toLowerCase().trim();
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Positions on the members list that are ordinary membership, not leadership.
const NON_LEADERSHIP_POSITIONS = new Set(["", "member", "members", "general member"]);

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
  const target = normalize(email);
  if (!target) return false;
  if ((club?.leaders || []).some((l) => normalize(l?.email) === target)) return true;
  return (club?.members || []).some(
    (m) => normalize(m?.email) === target && isLeadershipPosition(m?.position),
  );
}
