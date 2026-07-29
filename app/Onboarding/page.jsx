"use client"

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Check,
  GraduationCap,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Icon } from "@iconify/react";

const BRANCHES = [
  "PIE", "CSE", "CSE (Dual)", "IT", "ME", "ME (Dual)",
  "EE", "EE (Dual)", "ECE", "ECE (Dual)", "CE", "CE (Dual)",
  "MnC", "SET", "R&A", "VLSI", "IIoT", "AIML", "AI & DS", "B.Arch.",
];

const YEARS = [
  { value: "1", label: "1st Year", hint: "Just started my journey." },
  { value: "2", label: "2nd Year", hint: "Finding my direction." },
  { value: "3", label: "3rd Year", hint: "Building projects & skills." },
  { value: "4", label: "4th Year", hint: "Preparing for placements." },
  { value: "5", label: "5th Year", hint: "Final year of dual degree." },
];

const SKILL_SUGGESTIONS = [
  "React", "Python", "Machine Learning", "UI/UX", "Figma", "Node.js",
  "Data Science", "C++", "Java", "Public Speaking", "Video Editing",
  "Photography", "Writing", "Robotics", "IoT", "Cloud", "DevOps", "Rust",
  "TypeScript", "Next.js", "Tailwind", "Flutter", "Kotlin", "Swift",
  "Blender", "Solidity", "DSA", "SQL", "MongoDB", "PostgreSQL",
  "TensorFlow", "PyTorch", "OpenCV", "AWS", "GCP", "Azure",
  "Docker", "Kubernetes", "Git", "Linux", "Arduino", "Raspberry Pi",
  "3D Modeling", "Animation", "Graphic Design", "Content Writing",
  "SEO", "Marketing", "Product Management", "Entrepreneurship",
];


const STEPS = ["profile", "branch", "year", "skills", "done"];

// Explicit palette (no semantic tokens)
const C = {
  bg: "#ffffff",
  text: "#363636",
  subtext: "#6b7280",
  muted: "#f3f4f6",
  border: "#e5e7eb",
  borderStrong: "#111827",
  primary: "#000",
  primaryFg: "#ffffff",
  primarySoft: "#F5F5F5",
};

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [visited, setVisited] = useState(new Set([0]));
  const [data, setData] = useState({
    photo: null,
    name: "",
    branch: "",
    year: "",
    skills: [],
  });

  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  const canContinue = useMemo(() => {
    if (current === "profile") return data.name.trim().length > 1;
    if (current === "branch") return !!data.branch;
    if (current === "year") return !!data.year;
    if (current === "skills") return data.skills.length > 0;
    return true;
  }, [current, data]);

  const advance = () => {
    setDirection(1);
    setStep((s) => {
      const t = Math.min(s + 1, STEPS.length - 1);
      setVisited((v) => new Set(v).add(t));
      return t;
    });
  };
  const next = () => {
    if (!canContinue) return;
    advance();
  };
  const back = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const autoAdvance = (stepName) => {
    if (current !== stepName) return;
    if (visited.has(step + 1)) return;
    window.setTimeout(advance, 220);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-white"
      style={{ background: C.bg, color: C.text, fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Top progress bar */}
      <div className="w-full pt-5 pb-4 md:pt-10 flex justify-center shrink-0">
        <div
          className="h-1 w-full max-w-[280px] rounded-full overflow-hidden"
          style={{ background: C.muted }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: "#506BF2" }}
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      {/* Content — centered horizontally, natural vertical flow so buttons sit right under content */}
      <main className="flex flex-1 items-center justify-center overflow-hidden">
        <div className="flex w-full max-w-[640px] flex-col items-start gap-8 px-5 pt-3 pb-20">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              initial={{ opacity: 0, x: direction * 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -32 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              {current === "profile" && (
                <ProfileStep data={data} setData={setData} />
              )}
              {current === "branch" && (
                <BranchStep
                  data={data}
                  setData={setData}
                  onPick={() => autoAdvance("branch")}
                />
              )}
              {current === "year" && (
                <YearStep
                  data={data}
                  setData={setData}
                  onPick={() => autoAdvance("year")}
                />
              )}
              {current === "skills" && (
                <SkillsStep data={data} setData={setData} />
              )}
              {current === "done" && <DoneStep data={data} />}
            </motion.div>
          </AnimatePresence>

          {/* Nav — sits directly under content, like reference */}
          {current !== "done" && (
            <div
              className="fixed bottom-0 flex gap-3 left-0 right-0 border-t  border-[#1010101a] bg-white px-5 py-3 lg:static lg:border-none lg:bg-transparent lg:p-0"
            >
              {(step > 0 || canContinue) && (
                <button
                  onClick={next}
                  disabled={!canContinue}
                  className="inline-flex items-center justify-center bg-[#506bf2] rounded-full px-4 py-3 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#344ce7]"
                  style={{ color: C.primaryFg }}
                >
                  {step === STEPS.length - 2 ? "Finish" : "Continue"}
                </button>
              )}
              {step > 0 && (
                <button
                  onClick={back}
                  className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition hover:bg-[#f5f5f5]"
                  style={{ color: C.text }}
                >
                  Back
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ---------- Steps ---------- */

function ProfileStep({
  data,
  setData,
}) {
  const inputRef = useRef(null);

  const onFile = (f) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setData((d) => ({ ...d, photo: reader.result }));
    reader.readAsDataURL(f);
  };

  const initial = data.name.trim().charAt(0).toUpperCase();

  return (
    <div>
      <h1
        className="text-xl md:text-3xl font-bold"
        style={{ color: C.text }}
      >
        Welcome to Unilynk!
        <br />
        Let's set up your profile
      </h1>

      {/* Avatar uploader */}
      <div className="mt-6 mb-8 flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative group"
          aria-label="Upload profile picture"
        >
          <div
            className="h-24 w-24 rounded-full overflow-hidden grid place-items-center transition"
            style={{ background: C.muted }}
          >
            {data.photo ? (
              <img src={data.photo} alt="" className="h-full w-full object-cover" />
            ) : initial ? (
              <span className="text-[36px] font-black" style={{ color: C.subtext }}>{initial}</span>
            ) : (
              <Camera className="h-7 w-7" style={{ color: C.subtext }} />
            )}
          </div>
          <span
            className="absolute bottom-0 right-0 h-8 w-8 rounded-full grid place-items-center shadow-md group-active:scale-95 transition"
            style={{ background: C.primary }}
          >
            {data.photo ? <Pencil className="h-3.5 w-3.5 text-[#fff]" /> : <Plus className="h-4 w-4 text-[#fff]" strokeWidth={3} />}
          </span>
        </button>
        <div className="flex flex-col gap-1">
          <div className="text-[13px] font-semibold" style={{ color: C.text }}>
            {data.photo ? "Looking good!" : "Add a profile picture"}
          </div>
          <div className="text-[12px]" style={{ color: C.subtext }}>
            {data.photo ? "Tap the avatar to change." : "PNG or JPG, up to 5MB."}
          </div>
          {data.photo && (
            <button
              type="button"
              onClick={() => setData((d) => ({ ...d, photo: null }))}
              className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-semibold transition self-start"
              style={{ color: C.subtext }}
            >
              <Trash2 className="h-3 w-3" />
              Remove photo
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* Name input */}
      <div className="w-full max-w-[520px]">
        <label className="mb-3 block text-base font-normal" style={{ color: C.text }}>
          What's your name?
        </label>
        <input
          autoFocus
          value={data.name}
          onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
          placeholder="e.g. Ananya Sharma"
          className="h-10 w-full rounded-lg border px-3 text-sm outline-none transition-colors font-medium outline-none transition"
          style={{
            background: C.bg,
            color: C.text,
            border: `1px solid ${C.border}`,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = C.primary;

          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = C.border;

          }}
        />
      </div>
    </div>
  );
}

function BranchStep({
  data,
  setData,
  onPick,
}) {
  return (
    <div>
      <h1
        className="text-xl md:text-3xl font-bold tracking-tight"
        style={{ color: C.text }}
      >
        Which branch are you in?
      </h1>
      <div className="mt-8 flex flex-wrap gap-2.5">
        {BRANCHES.map((b) => {
          const active = data.branch === b;
          const badge = b.replace(/[^A-Z&]/g, "").slice(0, 3) || b.slice(0, 2);
          return (
            <button
              key={b}
              onClick={() => {
                setData((d) => ({ ...d, branch: b }));
                onPick();
              }}
              className="inline-flex items-center gap-2 rounded-full px-4 h-10 text-[13px] font-medium transition-all active:scale-[0.97]"
              style={{
                background: active ? "#E7E7E7" : C.bg,
                color: C.text,
                border: active
                  ? "1px solid #10101080"
                  : `1px solid ${C.border}`,

              }}
            >
              <span
                className="h-5 min-w-5 px-1 rounded-full grid place-items-center text-[9px] font-black tracking-tight"
                style={{
                  background: active ? C.primary : C.muted,
                  color: active ? C.primaryFg : C.text,
                }}
              >
                {badge}
              </span>
              {b}

            </button>
          );
        })}
      </div>
    </div>
  );
}

function YearStep({
  data,
  setData,
  onPick,
}) {
  return (
    <div>
      <h1
        className="text-xl md:text-3xl font-bold tracking-tight"
        style={{ color: C.text }}
      >
        What year are you in?
      </h1>
      <p className="mt-2 text-[14px]" style={{ color: C.subtext }}>
        Helps us connect you with the right peers, seniors, and juniors.
      </p>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {YEARS.map((y) => {
          const active = data.year === y.value;
          return (
            <button
              key={y.value}
              onClick={() => {
                setData((d) => ({ ...d, year: y.value }));
                onPick();
              }}
              className="text-left rounded-2xl p-4 transition-all active:scale-[0.98]"
              style={{
                background: active ? C.primarySoft : C.bg,
                border: `1px solid ${active ? C.border : C.border}`,

              }}
            >
              <div
                className="h-8 w-8 rounded-full grid place-items-center text-sm font-black mb-2"
                style={{
                  background: active ? C.primary : C.muted,
                  color: active ? C.primaryFg : C.text,
                }}
              >
                {y.value}
              </div>
              <div className="text-[14px] font-bold" style={{ color: C.text }}>{y.label}</div>
              <div className="mt-0.5 text-[11.5px] leading-snug" style={{ color: C.subtext }}>
                {y.hint}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SkillsStep({
  data,
  setData,
}) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);

  const add = (s) => {
    const v = s.trim();
    if (!v || data.skills.includes(v)) return;
    setData((d) => ({ ...d, skills: [...d.skills, v] }));
    setInput("");
  };
  const remove = (s) =>
    setData((d) => ({ ...d, skills: d.skills.filter((x) => x !== s) }));

  const query = input.trim().toLowerCase();
  const matches = query
    ? SKILL_SUGGESTIONS.filter(
      (s) => s.toLowerCase().includes(query) && !data.skills.includes(s),
    ).slice(0, 6)
    : [];
  const exactMatch = SKILL_SUGGESTIONS.some((s) => s.toLowerCase() === query);
  const showDropdown = focused && query.length > 0 && (matches.length > 0 || !exactMatch);
  const popular = SKILL_SUGGESTIONS.slice(0, 12);

  return (
    <div>
      <h1
        className="text-xl md:text-3xl font-bold tracking-tight"
        style={{ color: C.text }}
      >
        What are you good at?
      </h1>
      <p className="mt-2 text-[14px]" style={{ color: C.subtext }}>
        Search or pick your skills. You can change these later.
      </p>

      {/* Search input */}
      <div className="mt-6 relative">
        <div
          className="flex items-center gap-2 rounded-lg px-3 h-10 transition"
          style={{ background: C.bg, border: `1px solid ${focused ? C.primary : C.border}` }}
        >
          <Icon icon="solar:magnifer-linear" className="h-4 w-4 shrink-0 ml-1" style={{ color: C.subtext }} />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(matches[0] ?? input);
              }
            }}
            placeholder="Search a skill e.g. React, Figma, Python…"
            className="flex-1 bg-transparent outline-none text-[14px] py-2 min-w-0"
            style={{ color: C.text }}
          />
          {input && (
            <button
              onClick={() => add(input)}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold hover:opacity-90 active:scale-95 transition shrink-0"
              style={{ background: C.primary, color: C.primaryFg }}
            >
              <Plus className="h-3 w-3" />
              Add
            </button>
          )}
        </div>

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute z-10 mt-1.5 w-full rounded-xl overflow-hidden shadow-lg"
              style={{ background: C.bg, border: `1px solid ${C.border}` }}
            >
              {matches.map((s) => (
                <button
                  key={s}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    add(s);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-[14px] font-medium transition"
                  style={{ color: C.text }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.muted)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Plus className="h-3.5 w-3.5" style={{ color: C.subtext }} />
                  {s}
                </button>
              ))}
              {!exactMatch && input.trim() && (
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    add(input);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-[14px] font-medium transition"
                  style={{ color: C.text, borderTop: `1px solid ${C.border}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.muted)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >

                  Add "<span className="font-semibold">{input.trim()}</span>"
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected skills */}
      {data.skills.length > 0 && (
        <div className="mt-5">
          <div className="text-[12px] font-semibold mb-2 uppercase tracking-wide" style={{ color: C.subtext }}>
            Your skills ({data.skills.length})
          </div>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {data.skills.map((s) => (
                <motion.span
                  key={s}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold"
                  style={{ background: C.primary, color: C.primaryFg }}
                >
                  {s}
                  <button
                    onClick={() => remove(s)}
                    className="hover:opacity-70 -mr-1"
                    aria-label={`Remove ${s}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Popular */}
      <div className="mt-5">
        <div className="text-[12px] font-semibold mb-2 uppercase tracking-wide" style={{ color: C.subtext }}>
          Popular
        </div>
        <div className="flex flex-wrap gap-2">
          {popular.map((s) => {
            const active = data.skills.includes(s);
            return (
              <button
                key={s}
                onClick={() => (active ? remove(s) : add(s))}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-all active:scale-[0.97]"
                style={{
                  background: active ? C.primarySoft : C.bg,
                  color: C.text,
                  border: active
                    ? "1px solid #10101080"
                    : `1px solid ${C.border}`,

                }}
              >
                {active ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} style={{ color: C.primary }} />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                {s}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DoneStep({ data }) {
  return (
    <div className="flex flex-col items-center text-center pt-2">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="h-16 w-16 rounded-full grid place-items-center mb-4"
        style={{ background: C.primary, color: C.primaryFg }}
      >
        <Check className="h-7 w-7" strokeWidth={3} />
      </motion.div>
      <h1 className="text-xl md:text-3xl font-bold tracking-tight"
        style={{ color: C.text }}>
        Welcome to Unilynk{data.name ? `, ${data.name.split(" ")[0]}` : ""}.
      </h1>
      <p className="mt-2 text-[14px] max-w-md" style={{ color: C.subtext }}>
        Your profile is ready. Start exploring communities, projects, and people from your campus.
      </p>

      <div
        className="mt-6 w-full max-w-sm rounded-2xl p-4 text-left"
        style={{ background: C.bg, border: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-full overflow-hidden grid place-items-center shrink-0"
            style={{ background: C.muted }}
          >
            {data.photo ? (
              <img src={data.photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="h-5 w-5" style={{ color: C.subtext }} />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate" style={{ color: C.text }}>{data.name || "Unnamed"}</div>
            <div className="text-xs flex items-center gap-1.5" style={{ color: C.subtext }}>
              <GraduationCap className="h-3 w-3" />
              {data.branch || "—"} · Year {data.year || "—"}
            </div>
          </div>
        </div>
        {data.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {data.skills.slice(0, 6).map((s) => (
              <span
                key={s}
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: C.muted, color: C.text }}
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        className="mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3 text-[15px] font-semibold hover:opacity-90 active:scale-[0.98] transition"
        style={{ background: C.primary, color: C.primaryFg }}
      >
        <Sparkles className="h-4 w-4" />
        Enter Unilynk
      </button>
    </div>
  );
}
