"use client"

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Check,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Icon } from "@iconify/react";
import { SKILLS } from "@/lib/skillsList";

const BRANCHES = [
  "PIE", "CSE",
  "CSE(Dual)", "IT",
  "ME", "ME(Dual)",
  "EE ", "EE(Dual)",
  "ECE", "ECE(Dual)",
  "CE", "CE(Dual)", "MnC",
  "SET", "RA", "VLSI",
  "IIoT", "AIML",
  "AIDS", "B.Arch.",
];

const YEARS = [
  { value: "First Year", label: "1", hint: "Just started my journey." },
  { value: "Second Year", label: "2", hint: "Finding my direction." },
  { value: "Third Year", label: "3", hint: "Building projects & skills." },
  { value: "Fourth Year", label: "4", hint: "Preparing for placements." },
  { value: "Fifth Year", label: "5", hint: "Final year of dual degree." },
];


const STEPS = ["profile", "branch", "year", "skills"];

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
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [visited, setVisited] = useState(new Set([0]));
  const [data, setData] = useState({
    photo: null,
    name: "",
    branch: "",
    year: "",
    skills: [],
  });

  const current = STEPS[step];
  const progress = completed
  ? 100
  : (step / STEPS.length) * 100;

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
  const isLastStep = step === STEPS.length - 1;
  const next = () => {
    if (!canContinue) return;
    if (isLastStep) {
      saveProfile();
      return;
    }
    advance();
  };

  const saveProfile = async () => {
    if (loading) return;

    setCompleted(true);
    setLoading(true);

    try {
      const response = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: data.name,
          branch: data.branch,
          year: data.year,
          skills: data.skills,
        }),
      });
      const result = await response.json();

      if (response.status === 401) {
        router.push("/");
        return;
      }
      if (!response.ok) throw new Error(result.error || "Unable to save your profile.");

      router.replace("/dashboard");
    } catch (error) {
      console.error("Onboarding profile save failed:", error);
      setCompleted(false);
      setLoading(false);
      alert(error.message || "Unable to save your profile. Please try again.");
    }
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
            </motion.div>
          </AnimatePresence>

          {/* Nav — sits directly under content, like reference */}
          {(
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
                  {isLastStep ? "Finish" : "Continue"}
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

      {/* Premium loading screen */}
      <AnimatePresence>
        {loading && <LoadingScreen name={data.name} />}
      </AnimatePresence>
    </div>
  );
}
/* ---------- Loading screen ---------- */

function LoadingScreen({ name }) {
  const firstName = name?.trim().split(" ")[0] || "";
  const messages = [
    "Setting up your profile",
    "Matching you with your campus",
    "Finding people like you",
    "Almost there",
  ];
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
    }, 1400);
    return () => window.clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-6"
      style={{ background: C.bg, color: C.text, fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Spinner mark */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="relative h-16 w-16"
      >
        {/* Track */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ border: `3px solid ${C.muted}` }}
        />
        {/* Spinning arc */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: "3px solid transparent",
            borderTopColor: "#506BF2",
            borderRightColor: "#506BF2",
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, ease: "linear", duration: 0.9 }}
        />
        {/* Pulsing core */}
        <motion.div
          className="absolute inset-[22px] rounded-full"
          style={{ background: "#506BF2" }}
          animate={{ scale: [1, 0.7, 1], opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Rotating status text */}
      <div className="mt-8 h-6 overflow-hidden text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIndex}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-[15px] font-semibold"
            style={{ color: C.text }}
          >
            {messages[msgIndex]}
            {firstName && msgIndex === 0 ? `, ${firstName}` : ""}
          </motion.p>
        </AnimatePresence>
      </div>

      <p className="mt-1.5 text-[13px]" style={{ color: C.subtext }}>
        This will only take a moment.
      </p>

      {/* Indeterminate progress bar */}
      <div
        className="mt-7 h-1 w-full max-w-[220px] overflow-hidden rounded-full"
        style={{ background: C.muted }}
      >
        <motion.div
          className="h-full w-1/3 rounded-full"
          style={{ background: "#506BF2" }}
          animate={{ x: ["-120%", "320%"] }}
          transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}

/* ---------- Steps ---------- */

function ProfileStep({
  data,
  setData,
}) {
  const inputRef = useRef(null);

  const onFile = async (f) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      alert("Max size is 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", f);
    try {
      const response = await fetch("/api/user/upload-image", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Image upload failed");
      setData((d) => ({ ...d, photo: result.url }));
    } catch (error) {
      console.error("Profile image upload failed:", error);
      alert(error.message || "Image upload failed");
    }
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
                {y.label}
              </div>
              <div className="text-[14px] font-bold" style={{ color: C.text }}>{y.value}</div>
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
    ? SKILLS.filter(
      (s) => s.toLowerCase().includes(query) && !data.skills.includes(s),
    ).slice(0, 6)
    : [];
  const exactMatch = SKILLS.some((s) => s.toLowerCase() === query);
  const showDropdown = focused && query.length > 0 && (matches.length > 0 || !exactMatch);
  const popular = SKILLS.slice(0, 12);

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
