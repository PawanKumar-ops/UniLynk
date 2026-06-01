import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Check,
  Send,
  Sparkles,
  ChevronDown,
  Mail,
  Bell,
  CheckCircle2,
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

function AvatarCircle({ name, size = 32, textSize = "text-[10px]" }) {
  return (
    <div
      className={`rounded-full bg-neutral-900 text-white flex items-center justify-center ring-2 ring-white shadow-sm shrink-0 ${textSize}`}
      style={{ height: size, width: size }}
    >
      {initials(name)}
    </div>
  );
}

export function TeamFinderCard() {
  const [activeTab, setActiveTab] = useState("solo");
  const [selected, setSelected] = useState([]);
  const [query, setQuery] = useState("");
  const [requestTarget, setRequestTarget] = useState(null);
  const [message, setMessage] = useState("");
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const filtered = SOLO_USERS.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()),
  );

  const openUsersRequest = () => {
    const users = SOLO_USERS.filter((u) => selected.includes(u.id));
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
              <div className="h-8 w-8 rounded-lg bg-black text-white flex items-center justify-center">
                <Users className="h-4 w-4" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm text-neutral-900 leading-tight">Find Your Team</h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">Connect with solo applicants</p>
              </div>
            </div>
            <span className="inline-flex items-center bg-neutral-100 text-neutral-700 rounded-full text-[10px] px-2 py-0.5">
              <Sparkles className="h-2.5 w-2.5 mr-1" /> Live
            </span>
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
              {filtered.map((u) => {
                const isSelected = selected.includes(u.id);
                return (
                  <div
                    key={u.id}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-lg border transition-all ${
                      isSelected
                        ? "border-neutral-900 bg-neutral-50"
                        : "border-neutral-200 bg-white hover:border-neutral-300"
                    }`}
                  >
                    <AvatarCircle name={u.name} size={32} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-900 truncate leading-tight">{u.name}</p>
                      <p className="text-[10px] text-neutral-500 truncate mt-0.5">{u.email}</p>
                    </div>
                    <button
                      onClick={() => toggle(u.id)}
                      aria-label={isSelected ? "Deselect" : "Select"}
                      className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                        isSelected
                          ? "bg-neutral-900 border-neutral-900 scale-105"
                          : "border-neutral-300 hover:border-neutral-900 hover:bg-neutral-50"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </button>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-center text-xs text-neutral-500 py-6">No matches found</p>
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
              >
                <Send className="h-3 w-3 mr-1" /> Send Request
              </button>
            </div>
        </div>
        )}

        {/* Teams Tab */}
        {activeTab === "teams" && (
        <div className="px-4 pt-3 pb-4">
            <div className={`space-y-1.5 max-h-[22rem] pr-1 -mr-1 ${scrollClass}`}>
              {OPEN_TEAMS.map((t) => {
                const isOpen = expandedTeam === t.id;
                return (
                  <div
                    key={t.id}
                    className={`rounded-lg border transition-all overflow-hidden ${
                      isOpen
                        ? "border-neutral-900 bg-neutral-50/60"
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
                            {Array.from({ length: t.total - t.needed }).map((_, i) => (
                              <div
                                key={i}
                                className="h-4 w-4 rounded-full bg-neutral-900 ring-2 ring-white"
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
                                <AvatarCircle name={m.name} size={24} textSize="text-[9px]" />
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
    ? "Request sent"
    : isTeam
    ? "Request to join team"
    : "Send team request";

  const subtitle = sent
    ? "We've delivered your request."
    : isTeam && team
    ? `Ask to join ${team.name} for this event.`
    : `Invite ${recipientCount} ${recipientCount === 1 ? "person" : "people"} to form a team.`;

  const placeholder = isTeam
    ? "Briefly introduce yourself and why you'd be a great fit…"
    : "Hey, want to team up for this event? I'm working on…";

  const remaining = MAX_MESSAGE - message.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
      />
      <div className="relative w-full max-w-md h-[480px] flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.25)] animate-in fade-in zoom-in-95 duration-150">
        {/* Close */}
        <button
          onClick={onClose}
          disabled={sending}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 h-7 w-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors disabled:opacity-40"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="relative px-6 pt-6 pb-5 border-b border-neutral-100 bg-gradient-to-b from-neutral-50/70 to-white shrink-0">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0">
              {sent ? (
                <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
              ) : (
                <Send className="h-4 w-4" strokeWidth={2} />
              )}
            </div>
            <div className="min-w-0 pr-6">
              <h2 className="text-neutral-900 leading-tight">{title}</h2>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        {sent ? (
          <SuccessBody onClose={onClose} />
        ) : (
          <div className={`flex-1 min-h-0 px-6 py-5 space-y-4 ${scrollClass}`}>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2">
                {isTeam ? "Team" : `Recipients · ${recipientCount}`}
              </p>
              {isTeam && team ? (
                <TeamRecipientChip team={team} />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-1.5 pl-0.5 pr-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200/70"
                    >
                      <AvatarCircle name={u.name} size={20} textSize="text-[9px]" />
                      <span className="text-[11px] text-neutral-800">{u.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] uppercase tracking-wider text-neutral-500">
                  Message
                </label>
                <span
                  className={`text-[10px] ${
                    remaining < 20 ? "text-neutral-900" : "text-neutral-400"
                  }`}
                >
                  {remaining}
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
                placeholder={placeholder}
                rows={4}
                disabled={sending}
                className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50/60 text-sm p-3 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 focus:bg-white transition-colors disabled:opacity-60"
              />
              <p className="text-[10px] text-neutral-400 mt-1.5">
                A clear note about your skills and intent gets the best response rate.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        {!sent && (
          <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-neutral-100 bg-neutral-50/40 shrink-0">
            <button
              onClick={onClose}
              disabled={sending}
              className="rounded-lg h-9 px-3 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={onSend}
              disabled={sending}
              className="inline-flex items-center justify-center rounded-lg h-9 px-4 text-sm bg-neutral-900 hover:bg-neutral-800 text-white min-w-[120px] transition-colors disabled:opacity-60"
            >
              {sending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Send Request
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
    <div className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 bg-neutral-50/60">
      <div className="h-9 w-9 rounded-lg bg-neutral-900 text-white flex items-center justify-center shrink-0">
        <Users className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-neutral-900 leading-tight truncate">{team.name}</p>
        <p className="text-[11px] text-neutral-500 mt-0.5">Led by {team.lead}</p>
      </div>
      <span className="inline-flex items-center bg-white border border-neutral-200 text-neutral-700 rounded-full text-[10px] px-2 py-0">
        {team.needed} open
      </span>
    </div>
  );
}

function SuccessBody({ onClose }) {
  return (
    <div className="flex-1 min-h-0 flex flex-col px-6 py-5 gap-4">
      <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center shrink-0">
            <Mail className="h-4 w-4 text-neutral-700" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-neutral-900 leading-tight">Check your email</p>
            <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
              You'll get a confirmation now and an update once they respond.
            </p>
          </div>
        </div>
        <div className="h-px bg-neutral-200/70" />
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center shrink-0">
            <Bell className="h-4 w-4 text-neutral-700" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-neutral-900 leading-tight">
              Watch your Unilynk notifications
            </p>
            <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
              Replies and team updates appear in your notification center.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1" />
      <button
        onClick={onClose}
        className="w-full h-9 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-sm transition-colors shrink-0"
      >
        Got it
      </button>
    </div>
  );
}
