"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import "@/app/dashboard/dashboard.css";
import "@/components/events-pages.css";
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { DashboardEventsShell } from "@/components/DashboardEventsShell";
import { mapSoloStudents, mapTeams, useEventAnalytics } from "@/components/eventAnalytics/api";

/* ---------- data model ---------- */
const TINTS = ["#e8d5c4", "#cfe3d8", "#dcd6f0", "#f2d9dd", "#d7e4f0", "#efe6c9", "#d9ecd6", "#e6d9ea"];
const tintFor = (seed = "seed") => TINTS[[...String(seed)].reduce((acc, c) => acc + c.charCodeAt(0), 0) % TINTS.length];
const initials = (n = "") => String(n).split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

function statusOf(t) {
  const f = t.members?.length || 0;
  if (f >= (t.capacity || 5)) return { key: "full", label: "Complete", dot: "#111111" };
  if (f === 0) return { key: "empty", label: "Empty", dot: "#cfcfcf" };
  return { key: "partial", label: "Recruiting", dot: "#9a9a9a" };
}

/* ---------- shared bits ---------- */
function Avatar({ m, size = 34 }) {
  if (m?.img) {
    return (
      <img
        src={m.img}
        alt={m.name || "Member"}
        className="inline-flex shrink-0 rounded-full border border-black/10 object-cover"
        style={{ width: size, height: size }}
        title={`${m.name} · ${m.role}`}
      />
    );
  }

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-black/[0.05] font-semibold tracking-tight text-ink/55"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      title={`${m?.name || "Member"} · ${m?.role || "Member"}`}
    >
      {initials(m?.name || "M")}
    </span>
  );
}

function TeamsContent() {
  const searchParams = useSearchParams();
  const formId = searchParams.get("formId");
  const router = useRouter();

  const [teams, setTeams] = useState([]);
  const [solo, setSolo] = useState([]);
  const [open, setOpen] = useState({});
  const [filter, setFilter] = useState("all");
  const [filterMenu, setFilterMenu] = useState(false);
  const [admin, setAdmin] = useState(true);
  const [dragId, setDragId] = useState(null);
  const [overTeam, setOverTeam] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState("");

  const filterRef = useRef(null);

  const analyticsQuery = useEventAnalytics(formId);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!analyticsQuery.data) return;
    setTeams(mapTeams(analyticsQuery.data));
    setSolo(mapSoloStudents(analyticsQuery.data));
  }, [analyticsQuery.data]);

  useEffect(() => {
    const h = (e) => {
      if (filterRef.current && e.target instanceof Node && !filterRef.current.contains(e.target)) setFilterMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const saveMutation = useMutation({
    mutationFn: async ({ teams: nextTeams, solo: nextSolo }) => {
      const response = await fetch(`/api/forms/${formId}/teams`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teams: nextTeams, solo: nextSolo }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to save teams");
      return data;
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["forms", formId, "analytics"] }); setSaveToast("Teams saved successfully!"); },
    onError: (error) => setSaveToast(error.message || "Failed to save teams"),
  });

  const saveTeamsData = async () => {
    setSaving(true);
    setSaveToast("");

    if (!formId) { setSaveToast("Select an event before saving teams"); setSaving(false); return; }
    try { await saveMutation.mutateAsync({ teams, solo }); }
    finally { setSaving(false); setTimeout(() => setSaveToast(""), 3000); }
  };

  const stats = useMemo(() => {
    const full = teams.filter((t) => (t.members?.length || 0) >= t.capacity).length;
    return { total: teams.length, full, partial: teams.length - full, solo: solo.length };
  }, [teams, solo]);

  const FILTERS = [
    { key: "all", label: "All teams", count: stats.total },
    { key: "partial", label: "Recruiting", count: stats.partial },
    { key: "full", label: "Complete", count: stats.full },
  ];

  const activeFilter = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];

  const visible = teams.filter((t) =>
    filter === "full"
      ? (t.members?.length || 0) >= t.capacity
      : filter === "partial"
        ? (t.members?.length || 0) < t.capacity
        : true
  );

  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  function assign(teamId, memberId) {
    const person = solo.find((m) => m.id === memberId);
    const target = teams.find((t) => t.id === teamId);
    if (!person || !target || (target.members?.length || 0) >= target.capacity) return;
    setTeams((ts) =>
      ts.map((t) => (t.id === teamId ? { ...t, members: [...(t.members || []), person] } : t))
    );
    setSolo((s) => s.filter((m) => m.id !== memberId));
    setOpen((o) => ({ ...o, [teamId]: true }));
  }

  function drop(teamId) {
    if (dragId) assign(teamId, dragId);
    setDragId(null);
    setOverTeam(null);
  }

  function autoComplete(teamId) {
    setTeams((ts) =>
      ts.map((t) => {
        if (t.id !== teamId) return t;
        const currentLen = t.members?.length || 0;
        const need = t.capacity - currentLen;
        if (need <= 0) return t;
        const picks = solo.slice(0, need);
        if (picks.length) setSolo((s) => s.filter((m) => !picks.includes(m)));
        return { ...t, members: [...(t.members || []), ...picks] };
      })
    );
    setOpen((o) => ({ ...o, [teamId]: true }));
  }

  function deleteTeam(teamId) {
    setTeams((ts) => ts.filter((t) => t.id !== teamId));
  }

  function createTeam() {
    const capacity = Math.max(1, Number(analyticsQuery.data?.form?.teamSize) || 4);
    const nextNumber = teams.reduce((highest, team) => {
      if (team.source !== "admin") return highest;
      const match = String(team.name || "").match(/^Team\s+(\d+)$/i);
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0) + 1;
    const newTeam = {
      id: `admin_${crypto.randomUUID()}`,
      source: "admin",
      name: `Team ${nextNumber}`,
      track: "Admin created",
      capacity,
      members: [],
    };
    setTeams((currentTeams) => [newTeam, ...currentTeams]);
    setOpen((currentOpen) => ({ ...currentOpen, [newTeam.id]: true }));
  }

  return (
    <DashboardEventsShell>
      <main className="min-h-screen w-full bg-white text-ink">
        {/* Header */}
        <header
          className="sticky top-0 z-50 flex mb-5 h-[54px] w-full items-center justify-between border-b border-black/[0.06] bg-white/80 px-4 backdrop-blur-xl"
          style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
        >
          {/* Left */}
          <div
            className="flex items-center"
            style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
          >
            <button
              onClick={() => router.push(`/dashboard/eventanalytics${formId ? `?formId=${formId}` : ""}`)}
              className="mr-6 flex h-9 w-9 items-center cursor-pointer justify-center rounded-full transition hover:bg-black/5"
            >
              <ArrowLeft size={20} strokeWidth={2.2} />
            </button>

            <div>
              <h1 className="truncate text-[20px] font-bold leading-5 text-black">
                Teams
              </h1>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {saveToast && (
              <span className="font-mono text-xs font-semibold text-emerald-600 animate-fade-up">
                {saveToast}
              </span>
            )}
            <div className="group relative">
              <button
                onClick={saveTeamsData}
                disabled={saving}
                className="flex h-9 gap-1 px-4 items-center cursor-pointer justify-center rounded-full transition hover:bg-black/5 bg-white text-[#171717] disabled:opacity-50"
              >
                <Icon
                  icon="solar:pen-outline"
                  className="text-[21px] text-[#171717]"
                />
                {saving ? "Saving..." : "Save"}
              </button>

              <div className="pointer-events-none absolute right-1/2 top-full mt-2 translate-x-1/2 rounded-full bg-[#2c2f35] px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 transition-all duration-200 group-hover:translate-y-1 group-hover:opacity-100">
                Save Teams
              </div>
            </div>
          </div>
        </header>

        <div className="sm:px-3.5 sm:pb-6.5">
          {/* Stat strip */}
          <div className="grid grid-cols-4 divide-x divide-black/8 overflow-hidden rounded-2xl border border-black/8 bg-white">
            {[["Teams", stats.total], ["Complete", stats.full], ["Recruiting", stats.partial], ["Solo", stats.solo]].map(
              ([k, v]) => (
                <div key={k} className="flex flex-col items-center gap-1 px-1.5 py-3.5 text-center sm:items-start sm:px-4 sm:text-left">
                  <span className="font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-ink/40 sm:text-[10px]">{k}</span>
                  <span className="text-xl font-extrabold leading-none tracking-tight sm:text-2xl">{v}</span>
                </div>
              )
            )}
          </div>

          {/* Toolbar */}
          <div className="mt-6 flex items-center gap-2">
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterMenu((v) => !v)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${filterMenu ? "border-ink/12 bg-black/[0.03]" : "border-black/12 hover:border-black/25"}`}
              >
                <Icon icon="mynaui:filter" className="size-4 text-ink/60" />
                {activeFilter.label}
                <span className="rounded-full bg-black/[0.06] px-1.5 text-[11px] tabular-nums text-ink/55">{activeFilter.count}</span>
                <Icon
                  icon="solar:alt-arrow-down-linear"
                  className={`size-3.5 text-ink/40 transition ${filterMenu ? "rotate-180" : ""}`}
                />
              </button>
              {filterMenu && (
                <div className="animate-pop absolute left-0 top-[calc(100%+8px)] z-30 w-56 origin-top-left rounded-2xl border border-black/8 bg-white p-1.5 shadow-xl shadow-black/[0.08]">
                  <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/40">Filter by status</p>
                  <div className="flex flex-col gap-1">
                  {FILTERS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => {
                        setFilter(f.key);
                        setFilterMenu(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${filter === f.key ? "bg-black/[0.05] font-semibold" : "hover:bg-black/[0.03]"}`}
                    >
                      <span className="flex-1 text-left">{f.label}</span>
                      <span className="text-xs tabular-nums text-ink/45">{f.count}</span>
                      {filter === f.key && <Icon icon="lucide:check" className="size-4 text-ink" />}
                    </button>
                  ))}
                  </div>
                </div>
              )}
            </div>
            {admin && (
              <button onClick={createTeam} className="ml-auto flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:bg-ink/85">
                <Icon icon="lucide:plus" className="size-4" />
                <span className="hidden sm:inline">Add team</span>
                <span className="sm:hidden">New</span>
              </button>
            )}
          </div>

          {/* Team cards (accordion) */}
          <div className="mt-4 flex flex-col gap-3">
            {visible.map((t) => {
              const st = statusOf(t);
              const isOpen = !!open[t.id];
              const membersList = t.members || [];
              const slots = t.capacity - membersList.length;
              const isOver = overTeam === t.id && slots > 0;
              const pct = Math.round((membersList.length / t.capacity) * 100);
              return (
                <div
                  key={t.id}
                  onDragOver={(e) => {
                    if (slots > 0) {
                      e.preventDefault();
                      setOverTeam(t.id);
                    }
                  }}
                  onDragLeave={() => setOverTeam((o) => (o === t.id ? null : o))}
                  onDrop={() => drop(t.id)}
                  className={`overflow-hidden rounded-2xl border bg-white transition ${isOver ? "border-ink ring-2 ring-black/10" : isOpen ? "border-black/12 shadow-sm shadow-black/[0.03]" : "border-black/8 hover:border-black/16"}`}
                >
                  <button onClick={() => toggle(t.id)} className="flex w-full items-center gap-3.5 px-4 py-4 text-left sm:px-5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-black/[0.05] text-sm font-bold tracking-tight text-ink/60">
                      {initials(t.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-[15px] font-bold leading-tight sm:text-base">{t.name}</span>
                        <span className="rounded-md bg-black/[0.05] px-2 py-0.5 text-[11px] font-medium text-ink/55">{t.track}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.06em] ${st.key === "full" ? "bg-ink text-paper" : "border border-black/12 text-ink/45"
                            }`}
                        >
                          {st.label}
                        </span>
                      </span>
                      <span className="mt-1 block font-mono text-[11px] text-ink/40">
                        {membersList.length} / {t.capacity} members
                      </span>
                    </span>
                    <Icon
                      icon="solar:alt-arrow-down-linear"
                      className={`size-4 shrink-0 text-ink/35 transition ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <div className="mx-4 mb-4 h-1 overflow-hidden rounded-full bg-black/[0.06] sm:mx-5">
                    <div className="h-full rounded-full bg-ink/80 transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>

                  {isOpen && (
                    <div className="animate-row-in border-t border-black/8 bg-black/[0.012] px-4 pb-4 pt-4 sm:px-5">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-ink/40">
                          Roster · {membersList.length}/{t.capacity}
                        </span>
                        <div className="flex items-center gap-2">
                          {admin && membersList.length === 0 && (
                            <button onClick={() => deleteTeam(t.id)} className="flex items-center gap-1.5 rounded-full border border-black/12 px-3 py-1.5 text-[11px] font-semibold text-ink/55 transition hover:border-[#c2453f]/40 hover:bg-[#c2453f]/8 hover:text-[#b23a34]">
                              <Icon icon="solar:trash-bin-trash-linear" className="size-3.5" /> Delete team
                            </button>
                          )}
                          {admin && slots > 0 && solo.length > 0 && (
                            <button onClick={() => autoComplete(t.id)} className="flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-[11px] font-semibold text-paper transition hover:bg-ink/85">
                              <Icon icon="mage:robot-appreciate" className="size-3.5" /> Auto-complete
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {membersList.map((m) => (
                          <div key={m.id} className="flex items-center gap-2.5 rounded-xl border border-black/6 bg-white px-3 py-2">
                            <Avatar m={m} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold leading-tight">{m.name}</p>
                              <p className="truncate font-mono text-[11px] text-ink/40">{m.role}</p>
                            </div>
                          </div>
                        ))}
                        {Array.from({ length: slots }).map((_, i) => (
                          <div key={i} className={`flex items-center gap-2.5 rounded-xl border border-dashed px-3 py-2 text-xs font-medium transition ${isOver ? "border-ink bg-black/[0.04] text-ink/70" : "border-black/12 text-ink/35"}`}>
                            <span className="grid size-[34px] place-items-center rounded-full border border-dashed border-current"><Icon icon="lucide:plus" className="size-4" /></span>
                            Open slot
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Solo pool */}
          <div className="mt-8">
            <div className="mb-3 flex flex-wrap items-baseline gap-2">
              <h2 className="font-serif text-lg font-semibold">Solo members</h2>
              <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold text-ink/55">{solo.length}</span>
              <span className="ml-auto text-xs text-ink/45">Drag onto a team, or tap Add to team</span>
            </div>
            {solo.length === 0 ? (
              <div className="flex h-[calc(100vh-390px)] min-h-[420px] flex-col items-center justify-center px-4 text-center">
                <div className="mb-6 flex h-[220px] w-[280px] max-w-[80vw] items-center justify-center">
                  <img
                    src="/illuistrations/noParticipants.svg"
                    alt="No unassigned participants"
                    className="h-full w-full object-contain"
                  />
                </div>

                <h3 className="text-[17px] font-bold tracking-[-0.01em]">
                  No unassigned participants
                </h3>

                <p className="mt-1.5 max-w-[320px] text-[13.5px] leading-relaxed text-ink/45">
                  This space is currently empty.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {solo.map((m) => (
                  <div
                    key={m.id}
                    draggable
                    onDragStart={() => setDragId(m.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverTeam(null);
                    }}
                    className={`group flex cursor-grab items-center gap-3 rounded-2xl border border-black/8 bg-white px-4 py-3 transition hover:border-black/16 hover:shadow-sm active:cursor-grabbing ${dragId === m.id ? "opacity-40 ring-2 ring-black/10" : ""}`}
                  >
                    <Icon
                      icon="icon-park:drag"
                      className="hidden size-4 shrink-0 text-gray-500 group-hover:text-ink/40 sm:block"
                    />
                    <Avatar m={m} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold leading-tight">{m.name}</p>
                      <p className="truncate font-mono text-[11px] text-ink/40">{m.role}</p>
                    </div>
                    <button
                      onClick={() => setAssigning(m)}
                      className="flex shrink-0 items-center gap-1.5 rounded-full border border-black/12 px-3.5 py-1.5 text-xs font-semibold text-ink/70 transition hover:border-ink hover:bg-ink hover:text-paper"
                    >
                      <Icon icon="solar:user-plus-broken" className="size-4" /> <span className="hidden xs:inline">Add to team</span><span className="xs:hidden">Add</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </main>

      {/* Assign-to-team modal */}
      {assigning && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setAssigning(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-sheet flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl border border-black/8 bg-white shadow-2xl sm:max-w-md sm:rounded-3xl"
          >
            <div className="flex items-center gap-3 border-b border-black/8 px-5 py-4">
              <Avatar m={assigning} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-lg font-semibold leading-tight">Add {assigning.name}</p>
                <p className="truncate text-xs text-ink/50">{assigning.role} · choose a team below</p>
              </div>
              <button onClick={() => setAssigning(null)} className="grid size-9 place-items-center rounded-full transition hover:bg-black/5">
                <Icon icon="lucide:x" className="size-4" />
              </button>
            </div>
            <div className="scroll-area flex-1 overflow-y-auto p-3">
              {teams.filter((t) => (t.members?.length || 0) < t.capacity).length === 0 ? (
                <p className="py-10 text-center text-sm text-ink/45">No teams have open slots.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {teams
                    .filter((t) => (t.members?.length || 0) < t.capacity)
                    .map((t) => {
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            assign(t.id, assigning.id);
                            setAssigning(null);
                          }}
                          className="group flex items-center gap-3 rounded-2xl border border-black/8 bg-white px-4 py-3 text-left transition hover:border-ink hover:bg-black/[0.02]"
                        >
                          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-black/[0.05] text-sm font-bold tracking-tight text-ink/60">
                            {initials(t.name)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-bold leading-tight">{t.name}</span>
                            <span className="font-mono text-[11px] text-ink/40">{t.track} · {t.capacity - (t.members?.length || 0)} open</span>
                          </span>
                          <span className="flex items-center -space-x-2">
                            {(t.members || []).slice(0, 3).map((m) => (
                              <Avatar key={m.id} m={m} size={24} />
                            ))}
                          </span>
                          <span className="grid size-8 shrink-0 place-items-center rounded-full border border-black/10 text-ink/40 transition group-hover:border-ink group-hover:bg-ink group-hover:text-paper">
                            <Icon icon="lucide:plus" className="size-4" />
                          </span>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardEventsShell>
  );
}

export default function TeamsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-mono">Loading teams page...</div>}>
      <TeamsContent />
    </Suspense>
  );
}
