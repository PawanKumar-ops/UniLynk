import { useQuery } from "@tanstack/react-query";

const STALE_TIME = 60_000;

async function requestJson(url) {
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Unable to load event analytics");
  return data;
}

export async function getOwnedForms() {
  const data = await requestJson("/api/forms/MINE");
  return Array.isArray(data) ? data : data.forms || [];
}

export async function getEventAnalytics(formId) {
  if (!formId) return null;
  return requestJson(`/api/forms/${encodeURIComponent(formId)}/analytics`);
}

export function useOwnedForms() {
  return useQuery({
    queryKey: ["forms", "mine"],
    queryFn: getOwnedForms,
    staleTime: STALE_TIME,
  });
}

export function useEventAnalytics(formId) {
  return useQuery({
    queryKey: ["forms", formId, "analytics"],
    queryFn: () => getEventAnalytics(formId),
    enabled: Boolean(formId),
    staleTime: STALE_TIME,
    gcTime: 5 * 60_000,
  });
}

export function mapTeams(data) {
  return (data?.teams || []).map((team, index) => ({
    id: team._id || team.id || `team_${index}`,
    _id: team._id || team.id,
    source: team.source || "response",
    name: team.name || `Team ${index + 1}`,
    track: team.track || "Registered",
    capacity: team.total || team.capacity || 1,
    members: (team.members || []).map((member, memberIndex) => ({
      id: member.id || member._id || `member_${index}_${memberIndex}`,
      name: member.name || member.email || "Member",
      role: memberIndex === 0 ? "Lead" : member.role || "Member",
      email: member.email || "",
      img: member.img || member.avatar || null,
    })),
  }));
}

export function mapSoloStudents(data) {
  return (data?.teamFinder?.soloStudents || []).map((student, index) => ({
    id: student._id || student.id || `solo_${index}`,
    _id: student._id || student.id,
    name: student.name || student.email || "Solo Student",
    role: student.lookingFor || student.branch || "Participant",
    email: student.email || "",
    img: student.img || student.avatar || null,
  }));
}
