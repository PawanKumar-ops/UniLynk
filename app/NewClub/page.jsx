"use client"
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { Icon } from "@iconify/react";

const CATEGORIES = [
  "Innovation",
  "Technology",
  "Arts & Culture",
  "Sports & Fitness",
  "Social Impact",
  "Business & Entrepreneurship",
  "Science & Research",
  "Media & Communication",
  "Environment & Sustainability",
  "Other",
];


const STEPS = ["profile", "category", "about", "impact", "leadership"];

// Explicit palette (no semantic tokens) — matched to the onboarding reference.
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
  accent: "#506BF2",
};

const HEADING_LIMIT = 20;
const DESC_LIMIT = 150;


const emptyPoints = [
  { heading: "", description: "" },
  { heading: "", description: "" },
  { heading: "", description: "" },
  { heading: "", description: "" },
];

export default function App() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [visited, setVisited] = useState(new Set([0]));
  const [data, setData] = useState({
    photo: null,
    banner: null,
    name: "",
    category: "",
    about: "",
    points: emptyPoints,
    leaders: [],
  });

  const current = STEPS[step];
  const progress = (step / STEPS.length) * 100;

  const canContinue = useMemo(() => {
    if (current === "profile") return data.name.trim().length > 1;
    if (current === "category") return !!data.category;
    if (current === "about") return data.about.trim().length > 10;
    if (current === "impact")
      return data.points.every((p) => p.heading.trim() && p.description.trim());
    if (current === "leadership") return data.leaders.length > 0;
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
      createClub();
      return;
    }
    advance();
  };

  const createClub = async () => {
    if (loading) return;
    setLoading(true);
    setSubmitError("");

    const payload = {
      logo: data.photo || "",
      banner: data.banner || "",
      clubName: data.name.trim(),
      category: data.category,
      description: data.about.trim(),
      activities: data.points
        .filter((p) => p.heading.trim() && p.description.trim())
        .map((p) => ({
          title: p.heading.trim(),
          description: p.description.trim(),
        })),
      leaders: data.leaders.map((l) => ({
        email: l.email.trim().toLowerCase(),
        position: l.position.trim(),
        name: l.name?.trim() || "Unknown",
      })),
    };

    try {
      const res = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || "Failed to create club. Please try again.");
      }

      router.push("/?registered=true");
    } catch (err) {
      setLoading(false);
      setSubmitError(err.message || "Something went wrong while creating the club.");
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
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: C.bg, color: C.text, fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Top progress bar */}
      <div className="w-full pt-5 pb-4 md:pt-10 flex justify-center shrink-0">
        <div className="h-1 w-full max-w-[280px] rounded-full overflow-hidden" style={{ background: C.muted }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: C.accent }}
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      {/* Content */}
      <main className="flex flex-1 items-center justify-center overflow-y-auto">
        <div className="flex w-full max-w-[640px] flex-col items-start gap-8 px-5 pt-3 pb-20">
          {submitError && (
            <div className="w-full rounded-xl bg-red-50 p-3 text-center text-sm font-medium text-red-600 border border-red-200">
              {submitError}
            </div>
          )}

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
              {current === "profile" && <ProfileStep data={data} setData={setData} />}
              {current === "category" && (
                <CategoryStep data={data} setData={setData} onPick={() => autoAdvance("category")} />
              )}
              {current === "about" && <AboutStep data={data} setData={setData} />}
              {current === "impact" && <ImpactStep data={data} setData={setData} />}
              {current === "leadership" && <LeadershipStep data={data} setData={setData} />}
            </motion.div>
          </AnimatePresence>

          {/* Nav */}
          <div className="fixed bottom-0 flex gap-3 left-0 right-0 border-t border-[#1010101a] bg-white px-5 py-3 lg:static lg:border-none lg:bg-transparent lg:p-0">
            {(step > 0 || canContinue) && (
              <button
                onClick={next}
                disabled={!canContinue || loading}
                className="inline-flex items-center justify-center bg-[#506bf2] rounded-full px-6 py-3 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#344ce7]"
                style={{ color: C.primaryFg }}
              >
                {isLastStep ? (loading ? "Creating..." : "Create club") : "Continue"}
              </button>
            )}
            {step > 0 && (
              <button
                onClick={back}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition hover:bg-[#f5f5f5] disabled:opacity-40"
                style={{ color: C.text }}
              >
                Back
              </button>
            )}
          </div>
        </div>
      </main>

      <AnimatePresence>{loading && <LoadingScreen name={data.name} />}</AnimatePresence>
    </div>
  );
}

/* ---------- Loading screen ---------- */

function LoadingScreen({ name }) {
  const messages = [
    "Creating your club",
    "Setting up the space",
    "Inviting your leadership team",
    "Almost there",
  ];
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setMsgIndex((i) => (i + 1) % messages.length), 1400);
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
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="relative h-16 w-16"
      >
        <div className="absolute inset-0 rounded-full" style={{ border: `3px solid ${C.muted}` }} />
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: "3px solid transparent", borderTopColor: C.accent, borderRightColor: C.accent }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, ease: "linear", duration: 0.9 }}
        />
        <motion.div
          className="absolute inset-[22px] rounded-full"
          style={{ background: C.accent }}
          animate={{ scale: [1, 0.7, 1], opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
        />
      </motion.div>

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
            {name.trim() && msgIndex === 0 ? ` — ${name.trim()}` : ""}
          </motion.p>
        </AnimatePresence>
      </div>

      <p className="mt-1.5 text-[13px]" style={{ color: C.subtext }}>
        This will only take a moment.
      </p>

      <div className="mt-7 h-1 w-full max-w-[220px] overflow-hidden rounded-full" style={{ background: C.muted }}>
        <motion.div
          className="h-full w-1/3 rounded-full"
          style={{ background: C.accent }}
          animate={{ x: ["-120%", "320%"] }}
          transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}

/* ---------- Steps ---------- */

function ProfileStep({ data, setData }) {
  const avatarRef = useRef(null);
  const bannerRef = useRef(null);

  const readFile = (f, key) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      alert("Max size is 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setData((d) => ({ ...d, [key]: reader.result}));
    reader.readAsDataURL(f);
  };

  const initial = data.name.trim().charAt(0).toUpperCase();

  return (
    <div>
      <h1 className="text-xl md:text-3xl font-bold" style={{ color: C.text }}>
        Let's create your club
        <br />
        Start with the essentials
      </h1>

      {/* Banner + overlapping avatar */}
      <div className="mt-6 mb-8 w-full max-w-[520px]">
        <button
          type="button"
          onClick={() => bannerRef.current?.click()}
          className="relative block w-full h-40 rounded-2xl overflow-hidden group"
          style={{ background: C.muted, border: `1px solid ${C.border}` }}
          aria-label="Upload banner image"
        >
          {data.banner ? (
            <img src={data.banner} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="absolute inset-0 grid place-items-center">
              <span className="flex flex-col items-center gap-1.5" style={{ color: C.subtext }}>
                <ImagePlus className="h-6 w-6" />
                <span className="text-[12px] font-semibold">Add a banner image</span>
              </span>
            </span>
          )}
          <span
            className="absolute top-3 right-3 h-8 w-8 rounded-full grid place-items-center shadow-md group-active:scale-95 transition"
            style={{ background: C.primary }}
          >
            {data.banner ? <Pencil className="h-3.5 w-3.5 text-white" /> : <Plus className="h-4 w-4 text-white" strokeWidth={3} />}
          </span>
        </button>

        <div className="-mt-10 ml-4 flex items-end gap-4">
          <button
            type="button"
            onClick={() => avatarRef.current?.click()}
            className="relative group"
            aria-label="Upload profile picture"
          >
            <div
              className="h-24 w-24 rounded-2xl overflow-hidden grid place-items-center transition ring-4 ring-white"
              style={{ background: C.muted }}
            >
              {data.photo ? (
                <img src={data.photo} alt="" className="h-full w-full object-cover" />
              ) : initial ? (
                <span className="text-[36px] font-black" style={{ color: C.subtext }}>
                  {initial}
                </span>
              ) : (
                <Camera className="h-7 w-7" style={{ color: C.subtext }} />
              )}
            </div>
            <span
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full grid place-items-center shadow-md group-active:scale-95 transition"
              style={{ background: C.primary }}
            >
              {data.photo ? <Pencil className="h-3.5 w-3.5 text-white" /> : <Plus className="h-4 w-4 text-white" strokeWidth={3} />}
            </span>
          </button>
          <div className="flex flex-col gap-0.5 pb-1">
            <div className="text-[13px] font-semibold" style={{ color: C.text }}>
              {data.photo ? "Looking sharp!" : "Add a club logo"}
            </div>
            <div className="text-[12px]" style={{ color: C.subtext }}>
              PNG or JPG, up to 5MB.
            </div>
            {(data.photo || data.banner) && (
              <div className="mt-1 flex gap-3">
                {data.photo && (
                  <button
                    type="button"
                    onClick={() => setData((d) => ({ ...d, photo: null }))}
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
                    style={{ color: C.subtext }}
                  >
                    <Trash2 className="h-3 w-3" />
                    Logo
                  </button>
                )}
                {data.banner && (
                  <button
                    type="button"
                    onClick={() => setData((d) => ({ ...d, banner: null }))}
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
                    style={{ color: C.subtext }}
                  >
                    <Trash2 className="h-3 w-3" />
                    Banner
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={(e) => readFile(e.target.files?.[0] ?? null, "photo")} />
        <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={(e) => readFile(e.target.files?.[0] ?? null, "banner")} />
      </div>

      {/* Name input */}
      <div className="w-full max-w-[520px]">
        <label className="mb-3 block text-base font-normal" style={{ color: C.text }}>
          What's your club called?
        </label>
        <input
          autoFocus
          value={data.name}
          onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
          placeholder="e.g. Robotics & Automation Society"
          className="h-10 w-full rounded-lg border px-3 text-sm outline-none font-medium transition-colors"
          style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}` }}
          onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
          onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
        />
      </div>
    </div>
  );
}

function CategoryStep({
  data,
  setData,
  onPick,
}) {
  return (
    <div>
      <h1 className="text-xl md:text-3xl font-bold tracking-tight" style={{ color: C.text }}>
        What kind of club is it?
      </h1>
      <p className="mt-2 text-[14px]" style={{ color: C.subtext }}>
        Pick the category that fits best. This helps students discover you.
      </p>
      <div className="mt-8 flex flex-wrap gap-2.5">
        {CATEGORIES.map((c) => {
          const active = data.category === c;
          const badge = c.replace(/[^A-Za-z&]/g, "").slice(0, 2).toUpperCase();
          return (
            <button
              key={c}
              onClick={() => {
                setData((d) => ({ ...d, category: c }));
                onPick();
              }}
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
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AboutStep({ data, setData }) {
  return (
    <div>
      <h1 className="text-xl md:text-3xl font-bold tracking-tight" style={{ color: C.text }}>
        Tell us about the club
      </h1>
      <p className="mt-2 text-[14px]" style={{ color: C.subtext }}>
        A short, warm intro. What's your mission, and who is it for?
      </p>
      <div className="mt-6 w-full max-w-[520px]">
        <textarea
          autoFocus
          value={data.about}
          onChange={(e) => setData((d) => ({ ...d, about: e.target.value }))}
          placeholder="We're a community of makers building hardware projects, hosting workshops, and competing in national robotics events…"
          rows={6}
          className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none font-medium transition-colors resize-none leading-relaxed"
          style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}` }}
          onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
          onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
        />
      </div>
    </div>
  );
}

function ImpactStep({ data, setData }) {
  const update = (i, key, value) => {
    const limit = key === "heading" ? HEADING_LIMIT : DESC_LIMIT;
    setData((d) => {
      const points = d.points.map((p, idx) => (idx === i ? { ...p, [key]: value.slice(0, limit) } : p));
      return { ...d, points };
    });
  };

  return (
    <div>
      <h1 className="text-xl md:text-3xl font-bold tracking-tight" style={{ color: C.text }}>
        What do you do?
      </h1>
      <p className="mt-2 text-[14px]" style={{ color: C.subtext }}>
        Add four highlights that capture what members can expect.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 w-full">
        {data.points.map((p, i) => {
          const filled = p.heading.trim() && p.description.trim();
          return (
            <div
              key={i}
              className="rounded-2xl p-4 transition-colors"
              style={{ background: filled ? C.primarySoft : C.bg, border: `1px solid ${C.border}` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="h-6 w-6 rounded-full grid place-items-center text-[11px] font-black"
                  style={{ background: filled ? C.primary : C.muted, color: filled ? C.primaryFg : C.text }}
                >
                  {i + 1}
                </span>
                <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: C.subtext }}>
                  Highlight {i + 1}
                </span>
              </div>

              <div className="relative">
                <input
                  value={p.heading}
                  onChange={(e) => update(i, "heading", e.target.value)}
                  placeholder="Heading"
                  className="h-9 w-full rounded-lg border px-3 pr-12 text-sm outline-none font-semibold transition-colors bg-white"
                  style={{ color: C.text, border: `1px solid ${C.border}` }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold tabular-nums" style={{ color: C.subtext }}>
                  {p.heading.length}/{HEADING_LIMIT}
                </span>
              </div>

              <div className="relative mt-2.5">
                <textarea
                  value={p.description}
                  onChange={(e) => update(i, "description", e.target.value)}
                  placeholder="Describe it in a sentence or two."
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2 pb-6 text-[13px] outline-none font-medium transition-colors resize-none leading-snug bg-white"
                  style={{ color: C.text, border: `1px solid ${C.border}` }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                />
                <span className="absolute right-3 bottom-2 text-[10px] font-semibold tabular-nums" style={{ color: C.subtext }}>
                  {p.description.length}/{DESC_LIMIT}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeadershipStep({ data, setData }) {
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const query = email.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&scope=team`);
        if (res.ok) {
          const resData = await res.json();
          const list = Array.isArray(resData.users) ? resData.users : [];
          setSuggestions(list.filter((u) => u.email && !data.leaders.some((l) => l.email.toLowerCase() === u.email.toLowerCase())));
        }
      } catch (err) {
        console.error("User search failed:", err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [email, data.leaders]);

  const showDropdown = focused && suggestions.length > 0;

  const addLeader = (leader) => {
    const cleanEmail = leader.email.trim().toLowerCase();
    if (!cleanEmail || !leader.position.trim()) return;
    if (data.leaders.some((l) => l.email.toLowerCase() === cleanEmail)) return;

    const newLeader = {
      email: cleanEmail,
      position: leader.position.trim(),
      name: leader.name && leader.name.trim() ? leader.name.trim() : "Unknown",
    };

    setData((d) => ({ ...d, leaders: [...d.leaders, newLeader] }));
    setEmail("");
    setPosition("");
    setSuggestions([]);
  };

  const remove = (mail) =>
    setData((d) => ({ ...d, leaders: d.leaders.filter((l) => l.email.toLowerCase() !== mail.toLowerCase()) }));

  const canAdd = /\S+@\S+\.\S+/.test(email.trim()) && position.trim().length > 0;

  const getDicebearAvatar = (mail) =>
    `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(mail || "user")}&backgroundColor=ffffff`;

  return (
    <div>
      <h1 className="text-xl md:text-3xl font-bold tracking-tight" style={{ color: C.text }}>
        Who's on your leadership team?
      </h1>
      <p className="mt-2 text-[14px]" style={{ color: C.subtext }}>
        Add members by email and give each a position. We'll invite them to join.
      </p>

      <div className="mt-6 w-full max-w-[520px] flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative flex-1">
          <div
            className="flex items-center gap-2 rounded-lg px-3 h-10 transition bg-white"
            style={{ border: `1px solid ${focused ? C.primary : C.border}` }}
          >
            <Icon icon="solar:letter-linear" className="h-4 w-4 shrink-0" style={{ color: C.subtext }} />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 200)}
              placeholder="name@unilynk.edu"
              className="flex-1 bg-transparent outline-none text-[14px] py-2 min-w-0 font-medium"
              style={{ color: C.text }}
            />
          </div>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-10 mt-1.5 w-full rounded-xl overflow-hidden shadow-lg bg-white border border-gray-200"
              >
                {suggestions.map((u) => (
                  <button
                    key={u.id || u.email}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const matchedName = u.name && u.name !== "Student" ? u.name : "Unknown";
                      addLeader({ email: u.email, position: position || "Member", name: matchedName });
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition hover:bg-gray-50"
                  >
                    <img
                      src={getDicebearAvatar(u.email)}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover shrink-0 bg-gray-100"
                    />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold truncate" style={{ color: C.text }}>
                        {u.name || "Unknown"}
                      </span>
                      <span className="block text-[11.5px] truncate" style={{ color: C.subtext }}>
                        {u.email}
                      </span>
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <input
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="Position e.g. President"
          className="h-10 w-full sm:w-44 rounded-lg border px-3 text-[14px] outline-none font-medium transition-colors bg-white"
          style={{ color: C.text, border: `1px solid ${C.border}` }}
          onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
          onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canAdd) {
              e.preventDefault();
              const matched = suggestions.find((s) => s.email.toLowerCase() === email.trim().toLowerCase());
              addLeader({ email: email.trim(), position: position.trim(), name: matched?.name || "Unknown" });
            }
          }}
        />

        <button
          onClick={() => {
            const matched = suggestions.find((s) => s.email.toLowerCase() === email.trim().toLowerCase());
            addLeader({ email: email.trim(), position: position.trim(), name: matched?.name || "Unknown" });
          }}
          disabled={!canAdd}
          className="h-10 inline-flex items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          style={{ background: C.primary, color: C.primaryFg }}
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
          Add
        </button>
      </div>

      <p className="mt-2 text-[12px]" style={{ color: C.subtext }}>
        No match? You can still add anyone by typing their full email.
      </p>

      {data.leaders.length > 0 && (
        <div className="mt-6 w-full max-w-[520px]">
          <div className="text-[12px] font-semibold mb-2 uppercase tracking-wide" style={{ color: C.subtext }}>
            Leadership team ({data.leaders.length})
          </div>
          <div className="flex flex-col gap-2">
            <AnimatePresence>
              {data.leaders.map((l) => (
                <motion.div
                  key={l.email}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
                  style={{ background: C.primarySoft, border: "1px solid #10101014" }}
                >
                  <img
                    src={getDicebearAvatar(l.email)}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover shrink-0 bg-white border border-gray-200"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-bold truncate" style={{ color: C.text }}>
                      {l.name || "Unknown"}
                    </span>
                    <span className="block text-[11.5px] truncate" style={{ color: C.subtext }}>
                      {l.position} · {l.email}
                    </span>
                  </span>
                  <button
                    onClick={() => remove(l.email)}
                    className="h-7 w-7 rounded-full grid place-items-center transition hover:bg-[#10101010] shrink-0"
                    aria-label={`Remove ${l.email}`}
                  >
                    <X className="h-4 w-4" style={{ color: C.subtext }} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
