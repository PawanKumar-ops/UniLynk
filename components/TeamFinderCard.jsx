import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Check,
  ChevronDown,
  Mail,
  Bell,
  Loader2,
  X,
} from "lucide-react";

const SOLO_USERS = [
  { id: "1", name: "Aarav Sharma", email: "aarav.s@unilynk.in" },
  { id: "2", name: "Mira Patel", email: "mira.p@unilynk.in" },
  { id: "3", name: "Kabir Singh", email: "kabir.s@unilynk.in" },
  { id: "4", name: "Riya Verma", email: "riya.v@unilynk.in" },
  { id: "5", name: "Devansh Roy", email: "devansh.r@unilynk.in" },
];

const OPEN_TEAMS = [
  {
    id: "t1",
    name: "Pixel Pioneers",
    lead: "Ananya K.",
    needed: 2,
    total: 4,
    tags: ["Design", "Web"],
    members: [
      { name: "Ananya K.", email: "ananya.k@unilynk.in" },
      { name: "Vikram S.", email: "vikram.s@unilynk.in" },
    ],
    lookingFor: ["Backend", "PM"],
  },
  {
    id: "t2",
    name: "Quantum Coders",
    lead: "Rohan M.",
    needed: 1,
    total: 4,
    tags: ["AI", "Backend"],
    members: [
      { name: "Rohan M.", email: "rohan.m@unilynk.in" },
      { name: "Sara J.", email: "sara.j@unilynk.in" },
      { name: "Neel P.", email: "neel.p@unilynk.in" },
    ],
    lookingFor: ["Frontend"],
  },
  {
    id: "t3",
    name: "Stack Surfers",
    lead: "Isha B.",
    needed: 3,
    total: 5,
    tags: ["Full‑stack"],
    members: [
      { name: "Isha B.", email: "isha.b@unilynk.in" },
      { name: "Arjun D.", email: "arjun.d@unilynk.in" },
    ],
    lookingFor: ["Frontend", "Designer", "DevOps"],
  },
];

const scrollClass =
  "overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgb(212_212_212)_transparent] " +
  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent " +
  "[&::-webkit-scrollbar-thumb]:bg-neutral-300 [&::-webkit-scrollbar-thumb]:rounded-full " +
  "hover:[&::-webkit-scrollbar-thumb]:bg-neutral-400 [&::-webkit-scrollbar-thumb]:transition-colors";

const MAX_MESSAGE = 240;

const initials = (n) =>
  n.split(" ").map((p) => p[0]).slice(0, 2).join("");

function AvatarCircle({ name, src, size = 32, textSize = "text-[10px]" }) {
  const imageSrc = src || "";

  return (
    <div
      aria-label={name ? `${name} profile picture` : "Profile picture"}
      className={`rounded-full bg-neutral-900 text-white flex items-center justify-center ring-2 ring-white shadow-sm shrink-0 overflow-hidden bg-cover bg-center ${textSize}`}
      style={{
        height: size,
        width: size,
        backgroundImage: imageSrc ? `url(${imageSrc})` : undefined,
      }}
    >
      {!imageSrc && initials(name || "?")}
    </div>
  );
}

export function TeamFinderCard({ formId, refreshKey = 0 }) {
  const [activeTab, setActiveTab] = useState("solo");
  const [selected, setSelected] = useState([]);
  const [query, setQuery] = useState("");
  const [requestTarget, setRequestTarget] = useState(null);
  const [message, setMessage] = useState("");
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [soloUsers, setSoloUsers] = useState(formId ? [] : SOLO_USERS);
  const [openTeams, setOpenTeams] = useState(formId ? [] : OPEN_TEAMS);
  const [loadingEntries, setLoadingEntries] = useState(Boolean(formId));

  useEffect(() => {
    if (!formId) {
      setSoloUsers(SOLO_USERS);
      setOpenTeams(OPEN_TEAMS);
      setLoadingEntries(false);
      return;
    }

    let ignore = false;
    setLoadingEntries(true);

    fetch(`/api/forms/team-finder?formId=${formId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not load Team Finder");
        return res.json();
      })
      .then((data) => {
        if (ignore) return;
        setSoloUsers(data.solo || []);
        setOpenTeams(data.teams || []);
      })
      .catch((error) => {
        console.error(error);
        if (!ignore) {
          setSoloUsers([]);
          setOpenTeams([]);
        }
      })
      .finally(() => {
        if (!ignore) setLoadingEntries(false);
      });

    return () => {
      ignore = true;
    };
  }, [formId, refreshKey]);

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const filtered = soloUsers.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(query.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(query.toLowerCase()),
  );

  const openUsersRequest = () => {
    const users = soloUsers.filter((u) => selected.includes(u.id));
    if (!users.length) return;
    setRequestTarget({ kind: "users", users });
  };

  const openTeamRequest = (team) => {
    setRequestTarget({ kind: "team", team });
  };

  const closeModal = () => {
    if (sending) return;
    setRequestTarget(null);
    setTimeout(() => {
      setMessage("");
      setSent(false);
    }, 200);
  };

  const handleSend = async () => {
    setSending(true);
    await new Promise((r) => setTimeout(r, 900));
    setSending(false);
    setSent(true);
    if (requestTarget?.kind === "users") setSelected([]);
  };

  return (
    <>
      <div className="w-full max-w-[300px] overflow-hidden border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)] rounded-2xl">
        {/* Header */}
        <div className="relative px-4 pt-4 pb-3 bg-gradient-to-b from-neutral-50 to-white border-b border-neutral-100">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div>
                <h3 className="text-sm text-neutral-900 leading-tight">Find Your Team</h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">Connect with solo applicants</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pt-3">
          <div className="relative grid w-full grid-cols-2 bg-neutral-100 rounded-lg p-0.5 h-8">
            <div
              aria-hidden
              className="absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-md bg-white shadow-sm transition-transform duration-300 ease-out"
              style={{
                transform: activeTab === "solo" ? "translateX(0%)" : "translateX(100%)",
              }}
            />
            <button
              onClick={() => setActiveTab("solo")}
              className={`relative z-10 rounded-md text-xs transition-colors ${
                activeTab === "solo" ? "text-neutral-900" : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Solo
            </button>
            <button
              onClick={() => setActiveTab("teams")}
              className={`relative z-10 rounded-md text-xs transition-colors ${
                activeTab === "teams" ? "text-neutral-900" : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Open Teams
            </button>
          </div>
        </div>

        {/* Solo Tab */}
        {activeTab === "solo" && (
        <div className="px-4 pt-3 pb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or email"
                className="w-full pl-8 pr-3 h-8 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
              />
            </div>

            <div className={`mt-3 space-y-1.5 max-h-60 pr-1 -mr-1 ${scrollClass}`}>
              {loadingEntries ? (
                <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 py-6">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading Team Finder
                </div>
              ) : filtered.map((u) => {
                const isSelected = selected.includes(u.id);
                return (
                  <div
                    key={u.id}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-lg border transition-all ${
                      isSelected
  ? "border-neutral-200 bg-neutral-50"
  : "border-neutral-200 bg-white hover:border-neutral-300"
                    }`}
                  >
                    <AvatarCircle name={u.name} src={u.img || u.image || u.profilePicture} size={32} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-900 truncate leading-tight">{u.name}</p>
                      <p className="text-[10px] text-neutral-500 truncate mt-0.5">{u.email}</p>
                    </div>
                    <button
                      onClick={() => toggle(u.id)}
                      aria-label={isSelected ? "Deselect" : "Select"}
                      className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                        isSelected
  ? "bg-neutral-900 border-neutral-300 scale-105"
  : "border-neutral-300 hover:border-neutral-300 hover:bg-neutral-50"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </button>
                  </div>
                );
              })}
              {!loadingEntries && filtered.length === 0 && (
                <p className="text-center text-xs text-neutral-500 py-6">No solo users found</p>
              )}
            </div>

            <div className="h-px bg-neutral-100 my-3" />

            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-neutral-500">
                {selected.length > 0 ? (
                  <span className="text-neutral-900">{selected.length} selected</span>
                ) : (
                  "Tap circle to select"
                )}
              </p>
              <button
                disabled={selected.length === 0}
                onClick={openUsersRequest}
                className="inline-flex items-center bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg h-8 px-3 text-xs disabled:opacity-40 disabled:hover:bg-neutral-900 transition-colors"
              > Send Request
              </button>
            </div>
        </div>
        )}

        {/* Teams Tab */}
        {activeTab === "teams" && (
        <div className="px-4 pt-3 pb-4">
            <div className={`space-y-1.5 max-h-[22rem] pr-1 -mr-1 ${scrollClass}`}>
              {loadingEntries ? (
                <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 py-6">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading Team Finder
                </div>
              ) : openTeams.map((t) => {
                const isOpen = expandedTeam === t.id;
                return (
                  <div
                    key={t.id}
                    className={`rounded-lg border transition-all overflow-hidden ${
                      isOpen
  ? "border-neutral-200 bg-neutral-50/60"
  : "border-neutral-200 bg-white hover:border-neutral-300"
                    }`}
                  >
                    <button
                      onClick={() => setExpandedTeam(isOpen ? null : t.id)}
                      className="w-full p-2.5 text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-neutral-900 leading-tight">{t.name}</p>
                          <p className="text-[10px] text-neutral-500 mt-0.5">Led by {t.lead}</p>
                        </div>
                        <span className="inline-flex items-center bg-neutral-900 text-white rounded-full shrink-0 text-[9px] px-1.5 py-0">
                          {t.needed} open
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5">
                          <div className="flex -space-x-1">
                            {(t.members || []).slice(0, Math.max(t.total - t.needed, 0)).map((member, i) => (
                              <AvatarCircle
                                key={member.email || member.name || i}
                                name={member.name}
                                src={member.img || member.image || member.profilePicture}
                                size={16}
                                textSize="text-[7px]"
                              />
                            ))}
                            {Array.from({ length: t.needed }).map((_, i) => (
                              <div
                                key={i}
                                className="h-4 w-4 rounded-full bg-neutral-100 ring-2 ring-white border border-dashed border-neutral-300"
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-neutral-500">
                            {t.total - t.needed}/{t.total}
                          </span>
                        </div>
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-neutral-400 transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-2.5 pb-2.5 border-t border-neutral-200/70 pt-2.5 mt-0.5 space-y-2.5">
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-neutral-500 mb-1.5">
                            Members ({t.members.length})
                          </p>
                          <div className="space-y-1.5">
                            {t.members.map((m) => (
                              <div key={m.name} className="flex items-center gap-2">
                                <AvatarCircle name={m.name} src={m.img || m.image || m.profilePicture} size={24} textSize="text-[9px]" />
                                <div className="min-w-0">
                                  <p className="text-[11px] text-neutral-900 leading-tight truncate">
                                    {m.name}
                                  </p>
                                  <p className="text-[9px] text-neutral-500 mt-0.5 truncate">
                                    {m.email}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-neutral-500 mb-1.5">
                            Looking for
                          </p>
                          <div className="flex gap-1 flex-wrap">
                            {t.lookingFor.map((r) => (
                              <span
                                key={r}
                                className="text-[10px] px-1.5 py-0.5 rounded-full bg-white border border-neutral-200 text-neutral-700"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => openTeamRequest(t)}
                          className="w-full inline-flex items-center justify-center h-7 text-xs bg-neutral-900 hover:bg-neutral-800 text-white rounded-md transition-colors"
                        >
                          <Mail className="h-3 w-3 mr-1" /> Request to Join
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {!loadingEntries && openTeams.length === 0 && (
                <p className="text-center text-xs text-neutral-500 py-6">No open teams found</p>
              )}
            </div>
        </div>
        )}
      </div>

      <RequestModal
        target={requestTarget}
        open={!!requestTarget}
        onClose={closeModal}
        message={message}
        setMessage={setMessage}
        sending={sending}
        sent={sent}
        onSend={handleSend}
      />
    </>
  );
}

function RequestModal({ target, open, onClose, message, setMessage, sending, sent, onSend }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const isTeam = target?.kind === "team";
  const users = target?.kind === "users" ? target.users : [];
  const team = target?.kind === "team" ? target.team : null;
  const recipientCount = target?.kind === "users" ? users.length : 1;

  const title = sent
    ? "Request delivered"
    : isTeam
    ? "Join this team"
    : recipientCount === 1
    ? "Send a team request"
    : "Form a team";

  const subtitle = sent
    ? "We'll let you know the moment they reply."
    : isTeam && team
    ? `Introduce yourself to ${team.lead} and the ${team.name} crew.`
    : `Reach out to ${recipientCount} ${recipientCount === 1 ? "person" : "people"} and start building.`;

  const placeholder = isTeam
    ? "Briefly introduce yourself and why you'd be a great fit…"
    : "Hey, want to team up for this event? I'm working on…";

  const remaining = MAX_MESSAGE - message.length;
  const overLimit = remaining < 20;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-neutral-950/50 backdrop-blur-md animate-in fade-in duration-200"
      />
      <div className="relative w-full max-w-[440px] flex flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_1px_0_0_rgba(255,255,255,0.6)_inset,0_30px_80px_-20px_rgba(0,0,0,0.35),0_0_0_1px_rgba(0,0,0,0.06)] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
        {/* Ambient top accent */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(80%_120%_at_50%_0%,rgba(0,0,0,0.04),transparent_70%)] pointer-events-none" />

        {/* Close */}
        <button
          onClick={onClose}
          disabled={sending}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 active:scale-95 transition-all disabled:opacity-40"
        >
          <X className="h-4 w-4" strokeWidth={2.25} />
        </button>

        {/* Header */}
        <div className="relative px-6 pt-6 pb-5 border-b border-neutral-100 bg-gradient-to-b from-neutral-50/70 to-white shrink-0">
          <div className="flex items-start gap-3">
            
            <div className="min-w-0 pr-6">
              <h2 className="text-neutral-900 font-medium text-lg leading-tight">{title}</h2>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        {sent ? (
          <SuccessBody onClose={onClose} />
        ) : (
          <div className={`flex-1 min-h-0 px-7 pt-7 pb-2 space-y-5 ${scrollClass}`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] text-neutral-500 tracking-tight">
                  {isTeam ? "Team" : `To · ${recipientCount}`}
                </label>
              </div>
              {isTeam && team ? (
                <TeamRecipientChip team={team} />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-1.5 pl-0.5 pr-3 py-0.5 rounded-full bg-neutral-50 border border-neutral-200/80 shadow-[0_1px_0_rgba(0,0,0,0.02)]"
                    >
                      <AvatarCircle name={u.name} size={22} textSize="text-[9px]" />
                      <span className="text-[12px] text-neutral-800 tracking-tight">{u.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] text-neutral-500 tracking-tight">
                  Your message
                </label>
                <span
                  className={`text-[11px] tabular-nums transition-colors ${
                    overLimit ? "text-neutral-900" : "text-neutral-400"
                  }`}
                >
                  {remaining}
                </span>
              </div>
              <div className="group relative rounded-2xl border border-neutral-200 bg-neutral-50/70 focus-within:bg-white focus-within:border-neutral-900 focus-within:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] transition-all">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
                  placeholder={placeholder}
                  rows={4}
                  disabled={sending}
                  className="w-full resize-none rounded-2xl bg-transparent text-[13px] leading-relaxed p-3.5 focus:outline-none placeholder:text-neutral-400 disabled:opacity-60"
                />
              </div>
              <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">
                A clear note about your skills and intent gets the best response.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        {!sent && (
          <div className="mt-4 flex items-center justify-end gap-1.5 border-t border-black/5 bg-black/[0.02] px-5 py-3">
            <button
              onClick={onClose}
              disabled={sending}
              className="w-full py-2 bg-[#eceef1] text-black rounded-xl font-medium hover:bg-gray-200 active:scale-[0.98] transition-all duration-150"
            >
              Cancel
            </button>
            <button
              onClick={onSend}
              disabled={sending}
              className="w-full py-2 bg-black text-white rounded-xl font-medium hover:bg-gray-800 active:scale-[0.98] transition-all duration-150"
            >
              {sending ? (
                <div className="flex items-center justify-center gap-1">
                  <Loader2 className="h-full mr-1.5 animate-spin" />
                </div>
              ) : (
                <>
                  Send request
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TeamRecipientChip({ team }) {
  return (
    <div className="relative flex items-center gap-3 p-3 rounded-2xl border border-neutral-200/80 bg-gradient-to-br from-neutral-50 to-white shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-950 text-white flex items-center justify-center shrink-0 shadow-[0_4px_10px_-4px_rgba(0,0,0,0.4)]">
        <Users className="h-4 w-4" strokeWidth={2.25} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-neutral-950 leading-tight truncate tracking-tight">{team.name}</p>
        <p className="text-[11px] text-neutral-500 mt-1">Led by {team.lead}</p>
      </div>
      <span className="inline-flex items-center gap-1 bg-white border border-neutral-200 text-neutral-700 rounded-full text-[10px] px-2 py-0.5 shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {team.needed} open
      </span>
    </div>
  );
}

function SuccessBody({ onClose }) {
  return (
    <div className="flex-1 min-h-0 flex flex-col px-7 py-6 gap-5">
      <div className="rounded-2xl border border-neutral-200/80 bg-gradient-to-br from-neutral-50 to-white overflow-hidden">
        <div className="flex items-start gap-3 p-4">
          <div className="h-9 w-9 rounded-xl bg-white border border-neutral-200 flex items-center justify-center shrink-0 shadow-sm">
            <Mail className="h-4 w-4 text-neutral-700" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] text-neutral-950 leading-tight tracking-tight">Check your inbox</p>
            <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
              We've sent a confirmation and we'll ping you the moment they reply.
            </p>
          </div>
        </div>
        <div className="h-px bg-neutral-200/70 mx-4" />
        <div className="flex items-start gap-3 p-4">
          <div className="h-9 w-9 rounded-xl bg-white border border-neutral-200 flex items-center justify-center shrink-0 shadow-sm">
            <Bell className="h-4 w-4 text-neutral-700" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] text-neutral-950 leading-tight tracking-tight">Stay tuned in‑app</p>
            <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
              Replies and team updates land in your Unilynk notifications.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full py-2 bg-black text-white rounded-xl font-medium hover:bg-gray-800 active:scale-[0.98] transition-all duration-150"
      >
        Done
      </button>
    </div>
  );
}
