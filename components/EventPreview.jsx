"use client"

import { useMemo, useRef, useState } from "react";
import {
  Calendar,
  Check,
  ChevronDown,
  Clock,
  FileText,
  ImageIcon,
  MapPin,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

const C = {
  bg: "#ffffff",
  text: "#363636",
  subtext: "#6b7280",
  muted: "#f3f4f6",
  soft: "#ffffff",
  border: "#e5e7eb",
  primary: "#000000",
  primaryFg: "#ffffff",
  primarySoft: "#f5f5f5",
  accent: "#2c2c2e",
};

/* ---------- Mock data ---------- */

const EVENT = {
  club: "Cricket Club",
  clubLogo:
    "https://res.cloudinary.com/dpzqayckn/image/upload/v1784122081/club-logos/bxryxmx4jgzivqnixlsn.jpg",
  cover:
    "https://res.cloudinary.com/dpzqayckn/image/upload/v1784122921/event-covers/zbfxmye36apeekgxsbkc.webp",
  date: "Jul 17",
};

const INFO = [
  { icon: Calendar, label: "Date", value: "Aug 16" },
  { icon: Clock, label: "Time", value: "4:00 PM" },
  { icon: MapPin, label: "Location", value: "Main Campus" },
];

const USERS = [
  { roll: "2023CSE1042", name: "Ananya Sharma", branch: "CSE", year: "Second Year", avatar: "https://i.pravatar.cc/80?img=47" },
  { roll: "2022ECE0318", name: "Rohan Verma", branch: "ECE", year: "Third Year", avatar: "https://i.pravatar.cc/80?img=12" },
  { roll: "2023IT2201", name: "Ishita Nair", branch: "IT", year: "Second Year", avatar: "https://i.pravatar.cc/80?img=32" },
  { roll: "2021ME0091", name: "Karan Mehta", branch: "ME", year: "Fourth Year", avatar: "https://i.pravatar.cc/80?img=15" },
  { roll: "2023CSE1088", name: "Priya Reddy", branch: "CSE(Dual)", year: "First Year", avatar: "https://i.pravatar.cc/80?img=45" },
  { roll: "2022EE0455", name: "Aditya Singh", branch: "EE", year: "Third Year", avatar: "https://i.pravatar.cc/80?img=8" },
  { roll: "2023AIML0712", name: "Sneha Iyer", branch: "AIML", year: "Second Year", avatar: "https://i.pravatar.cc/80?img=27" },
  { roll: "2021CE0233", name: "Vikram Rao", branch: "CE", year: "Fourth Year", avatar: "https://i.pravatar.cc/80?img=3" },
];

const MCQ_OPTIONS = ["Batsman", "Bowler", "All-rounder", "Wicket-keeper"];
const CHECKBOX_OPTIONS = ["Jersey", "Bat", "Gloves", "Helmet", "Pads", "Water bottle"];
const DROPDOWN_OPTIONS = ["Beginner", "Intermediate", "Advanced", "Professional"];

/* ---------- Page ---------- */

export default function App() {
  const [team, setTeam] = useState([]);
  const [teamOpen, setTeamOpen] = useState(false);

  const [about, setAbout] = useState("");
  const [role, setRole] = useState("");
  const [gear, setGear] = useState([]);
  const [level, setLevel] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [files, setFiles] = useState([]);

  const toggleGear = (g) =>
    setGear((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  return (
    <div className="min-h-full w-full" style={{ background: C.bg, color: C.text }}>
      <div className="mx-auto w-full max-w-[640px] px-[10px] py-8 sm:py-12">
        {/* ---------- Banner ---------- */}
        <div style={{ backgroundColor: "rgb(247, 247, 249)", borderRadius: 28, position: "relative", border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "rgb(235, 235, 237)", borderRadius: 999, padding: "6px 13px 6px 7px" }}>
              <div style={{ width: 20, height: 20, backgroundColor: "rgb(28, 28, 30)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <div className="w-[20px] h-[20px] rounded-full overflow-hidden bg-white flex items-center justify-center">
                  <img alt="Cricket Club logo" className="w-full h-full object-cover rounded-full block" src={EVENT.clubLogo} />
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: "rgb(28, 28, 30)" }}>{EVENT.club}</span>
            </div>
          </div>
          <div style={{ margin: "0px 10px", borderRadius: 20, overflow: "hidden", height: 250, border: "1px solid rgb(230, 230, 230)", backgroundColor: "#efeff2" }}>
            <img alt="Cricket Tournament" src={EVENT.cover} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "center", position: "relative", zIndex: 2 }}>
            <div style={{ backgroundColor: "rgb(44, 44, 46)", color: "rgb(255, 255, 255)", border: "3px solid rgb(255, 255, 255)", borderRadius: 999, padding: "7px 22px", fontSize: 13, fontWeight: 500, margin: "12px 0px -16px" }}>
              {EVENT.date}
            </div>
          </div>
        </div>

        {/* ---------- Title ---------- */}
        <div className="mt-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: C.text }}>
            Inter-College Cricket Cup
          </h1>
          <p className="mt-1.5 text-[14px]" style={{ color: C.subtext }}>
            Register your team for the summer tournament.
          </p>
        </div>

        {/* ---------- Info cards (square) ---------- */}
        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          {INFO.map((it) => {
            const Icon = it.icon;
            return (
              <div key={it.label} className="rounded-2xl p-3 sm:p-4" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                <div className="h-8 w-8 rounded-full grid place-items-center mb-2 sm:mb-3" style={{ background: C.muted }}>
                  <Icon className="h-4 w-4" style={{ color: C.text }} />
                </div>
                <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.subtext }}>
                  {it.label}
                </div>
                <div className="mt-0.5 text-[13px] sm:text-[15px] font-bold leading-snug" style={{ color: C.text }}>
                  {it.value}
                </div>
                <div className="mt-0.5 text-[11px] sm:text-[12px] leading-snug" style={{ color: C.subtext }}>
                  {it.hint}
                </div>
              </div>
            );
          })}
        </div>

        {/* ---------- Add Team ---------- */}
        <div className="mt-6">
          {!teamOpen && team.length === 0 ? (
            <div className="rounded-2xl p-4" style={{ background: C.accent }}>
              <div className="text-[15px] font-bold" style={{ color: C.primaryFg }}>
                Manage Team
              </div>
              <div className="mt-0.5 text-[12px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                {EVENT.date}, 2026
              </div>
              <button
                onClick={() => setTeamOpen(true)}
                className="mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[13px] font-semibold transition active:scale-[0.99] hover:opacity-90"
                style={{ background: C.bg, color: C.text }}
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Add Team
              </button>
            </div>
          ) : (
            <TeamPicker team={team} setTeam={setTeam} onClose={() => setTeamOpen(false)} />
          )}
        </div>

        {/* ---------- Questions ---------- */}
        <div className="mt-8 flex flex-col gap-8">
          {/* Paragraph */}
          <Field label="Tell us about your team" required>
            <textarea
  value={about}
  onChange={(e) => {
    setAbout(e.target.value);
    e.currentTarget.style.height = "auto";
    e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
  }}
  rows={1}
  placeholder="A few words about your team's playing style, past wins…"
  className="w-full resize-none rounded-lg border px-3 py-2.5 text-sm font-medium outline-none transition-colors leading-relaxed overflow-hidden"
  style={{
    background: C.bg,
    color: C.text,
    border: `1px solid ${C.border}`,
    minHeight: 40,
    height: 40,
  }}
  onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
  onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
/>
          </Field>

          {/* Multiple choice */}
          <Field label="What's your primary role on the field?" required>
            <div className="flex flex-col gap-2.5 w-full">
              {MCQ_OPTIONS.map((opt) => {
                const active = role === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setRole(opt)}
                    className="w-full inline-flex items-center justify-start rounded-full px-5 h-11 text-[14px] font-medium transition-all active:scale-[0.99]"
                    style={{
                      background: active ? "#E7E7E7" : C.bg,
                      color: C.text,
                      border: active ? "1px solid #10101080" : `1px solid ${C.border}`,
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Checkboxes */}
          <Field label="What gear will you bring?">
            <div className="flex flex-wrap gap-2.5">
              {CHECKBOX_OPTIONS.map((opt) => {
                const active = gear.includes(opt);
                const badge = opt.slice(0, 2).toUpperCase();
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleGear(opt)}
                    className="inline-flex items-center gap-2 rounded-full px-4 h-10 text-[13px] font-medium transition-all active:scale-[0.97]"
                    style={{
                      background: active ? "#E7E7E7" : C.bg,
                      color: C.text,
                      border: active ? "1px solid #10101080" : `1px solid ${C.border}`,
                    }}
                  >
                    <span
                      className="h-5 min-w-5 px-1 rounded-full grid place-items-center text-[9px] font-black tracking-tight"
                      style={{ background: active ? C.primary : C.muted, color: active ? C.primaryFg : C.text }}
                    >
                      {badge}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Dropdown */}
          <Field label="Experience level" required>
            <Dropdown value={level} onChange={setLevel} options={DROPDOWN_OPTIONS} placeholder="Select a level" />
          </Field>

          {/* Date */}
          <Field label="Preferred practice date" required>
            <IconInput icon={Calendar}>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 bg-transparent outline-none text-[14px] font-medium min-w-0"
                style={{ color: date ? C.text : C.subtext }}
              />
            </IconInput>
          </Field>

          {/* Time */}
          <Field label="Preferred practice time" required>
            <IconInput icon={Clock}>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="flex-1 bg-transparent outline-none text-[14px] font-medium min-w-0"
                style={{ color: time ? C.text : C.subtext }}
              />
            </IconInput>
          </Field>

          {/* File upload */}
          <Field label="Upload documents">
            <FileUpload files={files} setFiles={setFiles} />
          </Field>
        </div>

        {/* ---------- Submit ---------- */}
        <button
          onClick={() => alert("Registration submitted! (mock)")}
          className="mt-10 w-full inline-flex items-center justify-center rounded-full py-3.5 text-[15px] font-semibold transition active:scale-[0.99] hover:opacity-90"
          style={{ background: C.primary, color: C.primaryFg }}
        >
          Submit registration
        </button>
      </div>
    </div>
  );
}

/* ---------- File upload ---------- */

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileUpload({ files, setFiles }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = (list) => {
    if (!list) return;
    const next = Array.from(list).map((f) => ({
      id: `${f.name}-${f.size}-${crypto.randomUUID()}`,
      name: f.name,
      size: f.size,
      type: f.type,
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
    }));
    setFiles((prev) => [...prev, ...next]);
  };

  const remove = (id) =>
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((f) => f.id !== id);
    });

  return (
    <div className="w-full">
      {/* Drop zone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className="w-full flex flex-col items-center justify-center gap-2 rounded-2xl px-6 py-8 text-center transition-colors"
        style={{
          background: dragging ? C.muted : C.bg,
          border: `1.5px dashed ${dragging ? C.primary : C.border}`,
        }}
      >
        <span className="h-11 w-11 rounded-full grid place-items-center" style={{ background: C.muted }}>
          <UploadCloud className="h-5 w-5" style={{ color: C.text }} />
        </span>
        <span className="text-[14px] font-semibold" style={{ color: C.text }}>
          Click to upload or drag &amp; drop
        </span>
        <span className="text-[12px]" style={{ color: C.subtext }}>
          Images, PDF or DOCX · up to 10MB each
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.currentTarget.value = "";
        }}
      />

      {/* Uploaded list */}
      {files.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5"
              style={{ background: C.soft, border: `1px solid ${C.border}` }}
            >
              <span className="h-10 w-10 rounded-lg overflow-hidden grid place-items-center shrink-0" style={{ background: C.muted }}>
                {f.preview ? (
                  <img src={f.preview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <FileText className="h-4 w-4" style={{ color: C.subtext }} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold truncate" style={{ color: C.text }}>
                  {f.name}
                </div>
                <div className="flex items-center gap-1.5 text-[11px]" style={{ color: C.subtext }}>
                  <span>{formatSize(f.size)}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1" style={{ color: "#16a34a" }}>
                    <Check className="h-3 w-3" strokeWidth={3} />
                    Uploaded
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(f.id)}
                className="h-8 w-8 rounded-full grid place-items-center transition hover:bg-[#ececef] shrink-0"
                aria-label={`Remove ${f.name}`}
              >
                <X className="h-4 w-4" style={{ color: C.subtext }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Field wrapper ---------- */

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-3 block text-base sm:text-[20px]" style={{ color: C.text }}>
        {label}
        {required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

/* ---------- Icon input shell ---------- */

function IconInput({ icon: Icon, children }) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="flex items-center gap-2 rounded-lg px-3 h-10 w-full transition-colors"
      style={{ background: C.bg, border: `1px solid ${focused ? C.primary : C.border}` }}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => setFocused(false)}
    >
      <Icon className="h-4 w-4 shrink-0 ml-0.5" style={{ color: C.subtext }} />
      {children}
    </div>
  );
}

/* ---------- Dropdown ---------- */

function Dropdown({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full flex items-center justify-between gap-2 rounded-lg px-3 h-10 text-[14px] font-medium transition-colors"
        style={{ background: C.bg, color: value ? C.text : C.subtext, border: `1px solid ${open ? C.primary : C.border}` }}
      >
        {value || placeholder}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform" style={{ color: C.subtext, transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div
          className="absolute z-10 mt-1.5 w-full rounded-xl overflow-hidden shadow-lg"
          style={{ background: C.bg, border: `1px solid ${C.border}` }}
        >
          {options.map((opt) => {
            const active = value === opt;
            return (
              <button
                key={opt}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(opt);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left text-[14px] font-medium transition"
                style={{ color: C.text, background: active ? C.muted : "transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.muted)}
                onMouseLeave={(e) => (e.currentTarget.style.background = active ? C.muted : "transparent")}
              >
                {opt}
                {active && <Check className="h-4 w-4" strokeWidth={2.5} style={{ color: C.primary }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Team picker ---------- */

function TeamPicker({ team, setTeam, onClose }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return [];
    return USERS.filter(
      (u) =>
        !team.some((t) => t.roll === u.roll) &&
        (u.roll.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)),
    ).slice(0, 5);
  }, [q, team]);

  const add = (u) => {
    setTeam((prev) => (prev.some((t) => t.roll === u.roll) ? prev : [...prev, u]));
    setQuery("");
  };
  const remove = (roll) => setTeam((prev) => prev.filter((t) => t.roll !== roll));

  return (
    <div className="rounded-2xl p-4" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[15px] font-bold" style={{ color: C.text }}>
            Add team members
          </div>
          <div className="mt-0.5 text-[12px]" style={{ color: C.subtext }}>
            Search by roll number or name.
          </div>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-full grid place-items-center transition hover:bg-[#f3f4f6]"
          aria-label="Close"
        >
          <X className="h-4 w-4" style={{ color: C.subtext }} />
        </button>
      </div>

      {/* Search */}
      <div className="mt-4 relative">
        <div
          className="flex items-center gap-2 rounded-lg px-3 h-11 transition-colors"
          style={{ background: C.bg, border: `1px solid ${focused ? C.primary : C.border}` }}
        >
          <Search className="h-4 w-4 shrink-0 ml-0.5" style={{ color: C.subtext }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="e.g. 2023CSE1042 or Ananya"
            className="flex-1 bg-transparent outline-none text-[14px] font-medium min-w-0"
            style={{ color: C.text }}
          />
        </div>

        {focused && q.length > 0 && (
          <div
            className="absolute z-10 mt-1.5 w-full rounded-xl overflow-hidden shadow-lg"
            style={{ background: C.bg, border: `1px solid ${C.border}` }}
          >
            {matches.length === 0 ? (
              <div className="px-4 py-3 text-[13px]" style={{ color: C.subtext }}>
                No students found.
              </div>
            ) : (
              matches.map((u) => (
                <button
                  key={u.roll}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    add(u);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition"
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.muted)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <img src={u.avatar} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" style={{ background: C.muted }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold truncate" style={{ color: C.text }}>
                      {u.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px]" style={{ color: C.subtext }}>
                      <span className="font-medium" style={{ color: C.text }}>{u.branch}</span>
                      <span>·</span>
                      <span>{u.year}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium tabular-nums shrink-0" style={{ color: C.subtext }}>
                    {u.roll}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected members */}
      {team.length > 0 && (
        <div className="mt-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: C.subtext }}>
            Team ({team.length})
          </div>
          <div className="flex flex-col gap-2">
            {team.map((u) => (
              <div
                key={u.roll}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{ background: C.soft, border: `1px solid ${C.border}` }}
              >
                <img src={u.avatar} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" style={{ background: C.muted }} />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold truncate" style={{ color: C.text }}>
                    {u.name}
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px]" style={{ color: C.subtext }}>
                    <span className="font-medium" style={{ color: C.text }}>{u.branch}</span>
                    <span>·</span>
                    <span>{u.year}</span>
                    <span>·</span>
                    <span className="tabular-nums">{u.roll}</span>
                  </div>
                </div>
                <button
                  onClick={() => remove(u.roll)}
                  className="h-8 w-8 rounded-full grid place-items-center transition hover:bg-[#ececef] shrink-0"
                  aria-label={`Remove ${u.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" style={{ color: C.subtext }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
