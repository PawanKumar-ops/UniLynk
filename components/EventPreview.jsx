"use client"

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { getDraft } from "@/lib/drafts";

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

const DEFAULT_EVENT = {
  club: "Cricket Club",
  clubLogo:
    "https://res.cloudinary.com/dpzqayckn/image/upload/v1784122081/club-logos/bxryxmx4jgzivqnixlsn.jpg",
  cover:
    "https://res.cloudinary.com/dpzqayckn/image/upload/v1784122921/event-covers/zbfxmye36apeekgxsbkc.webp",
  date: "Jul 17",
  name: "Inter-College Cricket Cup",
  time: "4:00 PM",
  venue: "Main Campus",
  isTeam: false,
  teamSize: 4,
  questions: [],
};

function formatDate(dateStr) {
  if (!dateStr) return "Jul 17";
  try {
    const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch (e) {
    return dateStr;
  }
}

function formatTime(timeStr) {
  if (!timeStr) return "4:00 PM";
  try {
    if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr;
    const [h, m] = timeStr.split(":");
    const date = new Date(2000, 0, 1, parseInt(h, 10), parseInt(m, 10));
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } catch (e) {
    return timeStr;
  }
}

/* ---------- Page ---------- */

export default function EventPreview({ formId: propFormId, initialData }) {
  const params = useParams();
  const formId = propFormId || params?.formId;

  const [eventData, setEventData] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [applied, setApplied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [team, setTeam] = useState([]);
  const [teamOpen, setTeamOpen] = useState(false);

  const [answers, setAnswers] = useState({});
  const [filesByQuestion, setFilesByQuestion] = useState({});

  useEffect(() => {
    if (initialData) {
      setEventData(initialData);
      setLoading(false);
      return;
    }

    if (!formId) {
      setEventData(DEFAULT_EVENT);
      setLoading(false);
      return;
    }

    let ignore = false;

    const loadForm = async () => {
      setLoading(true);
      try {
        if (formId.startsWith("draft_")) {
          const draft = getDraft(formId);
          if (draft && !ignore) {
            setEventData(draft);
            setLoading(false);
            return;
          }
        }

        const res = await fetch(`/api/forms/${formId}`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore) setEventData(data);
        }
      } catch (err) {
        console.error("Failed to load event data:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    const checkApplied = async () => {
      if (formId.startsWith("draft_")) return;
      try {
        const res = await fetch(`/api/forms/check-applied?formId=${formId}`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore) setApplied(Boolean(data.applied));
        }
      } catch (err) {
        console.error("Check applied error:", err);
      }
    };

    loadForm();
    checkApplied();

    return () => {
      ignore = true;
    };
  }, [formId, initialData]);

  const clubName = eventData?.clubId?.clubName || eventData?.club || DEFAULT_EVENT.club;
  const clubLogo = eventData?.clubId?.logo || eventData?.clubLogo || DEFAULT_EVENT.clubLogo;
  const coverImage = eventData?.banner || eventData?.image || eventData?.cover || DEFAULT_EVENT.cover;
  const rawDate = eventData?.date || DEFAULT_EVENT.date;
  const displayDate = formatDate(rawDate);
  const rawTime = eventData?.time || DEFAULT_EVENT.time;
  const displayTime = formatTime(rawTime);
  const displayVenue = eventData?.venue || eventData?.location || DEFAULT_EVENT.venue;

  const isTeamEvent = Boolean(eventData?.isTeam ?? eventData?.isTeamEvent);
  const maxTeamSize = Number(eventData?.teamSize || 4);

  const questions = eventData?.questions || [];

  const handleAnswerChange = (qId, val) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleToggleMultiple = (qId, option) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[qId]) ? prev[qId] : [];
      const next = current.includes(option)
        ? current.filter((x) => x !== option)
        : [...current, option];
      return { ...prev, [qId]: next };
    });
  };

  const handleFilesChange = (qId, filesList) => {
    setFilesByQuestion((prev) => ({ ...prev, [qId]: filesList }));
    setAnswers((prev) => ({
      ...prev,
      [qId]: filesList.map((f) => f.url || f.preview || f.name),
    }));
  };

  const handleSubmit = async () => {
    if (applied || submitted) return;

    const missingRequired = questions.filter(
      (q) => q.required && !answers[q.id] && (!filesByQuestion[q.id] || filesByQuestion[q.id].length === 0)
    );

    if (missingRequired.length > 0) {
      alert(`Please fill in required question: ${missingRequired[0].title || missingRequired[0].question || "Untitled question"}`);
      return;
    }

    if (!formId || formId.startsWith("draft_")) {
      alert("Registration submitted! (Preview Mode)");
      setSubmitted(true);
      return;
    }

    try {
      setSubmitting(true);
      const payloadAnswers = { ...answers };
      if (isTeamEvent) {
        payloadAnswers.team = team;
      }

      const res = await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId,
          answers: payloadAnswers,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Submission failed");
      }

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to submit registration");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full w-full flex items-center justify-center py-20" style={{ background: C.bg, color: C.subtext }}>
        Loading event details...
      </div>
    );
  }

  const infoCards = [
    { icon: Calendar, label: "Date", value: displayDate },
    { icon: Clock, label: "Time", value: displayTime },
    { icon: MapPin, label: "Location", value: displayVenue },
  ];

  return (
    <div className="min-h-full w-full" style={{ background: C.bg, color: C.text }}>
      <div className="mx-auto w-full max-w-[640px] px-[10px] py-8 sm:py-12">
        {/* ---------- Banner ---------- */}
        <div style={{ backgroundColor: "rgb(247, 247, 249)", borderRadius: 28, position: "relative", border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "rgb(235, 235, 237)", borderRadius: 999, padding: "6px 13px 6px 7px" }}>
              <div style={{ width: 20, height: 20, backgroundColor: "rgb(28, 28, 30)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <div className="w-[20px] h-[20px] rounded-full overflow-hidden bg-white flex items-center justify-center">
                  <img alt={clubName} className="w-full h-full object-cover rounded-full block" src={clubLogo} />
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: "rgb(28, 28, 30)" }}>{clubName}</span>
            </div>
          </div>
          <div style={{ margin: "0px 10px", borderRadius: 20, overflow: "hidden", height: 250, border: "1px solid rgb(230, 230, 230)", backgroundColor: "#efeff2" }}>
            <img alt={eventData?.name || "Event cover"} src={coverImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "center", position: "relative", zIndex: 2 }}>
            <div style={{ backgroundColor: "rgb(44, 44, 46)", color: "rgb(255, 255, 255)", border: "3px solid rgb(255, 255, 255)", borderRadius: 999, padding: "7px 22px", fontSize: 13, fontWeight: 500, margin: "12px 0px -16px" }}>
              {displayDate}
            </div>
          </div>
        </div>

        {/* ---------- Title ---------- */}
        <div className="mt-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: C.text }}>
            {eventData?.name || eventData?.title || "Inter-College Cricket Cup"}
          </h1>
          <p className="mt-1.5 text-[14px]" style={{ color: C.subtext }}>
            Register yourself and join the event.
          </p>
        </div>

        {/* ---------- Info cards (square) ---------- */}
        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          {infoCards.map((it) => {
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
              </div>
            );
          })}
        </div>

        {/* ---------- Add Team (Rendered ONLY IF Event is Team-based) ---------- */}
        {isTeamEvent && (
          <div className="mt-6">
            {!teamOpen && team.length === 0 ? (
              <div className="rounded-2xl p-4" style={{ background: C.accent }}>
                <div className="text-[15px] font-bold" style={{ color: C.primaryFg }}>
                  Build Your Team
                </div>
                <div className="mt-0.5 text-[12px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {maxTeamSize} members
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
              <TeamPicker
                team={team}
                setTeam={setTeam}
                maxSize={maxTeamSize}
                onClose={() => setTeamOpen(false)}
              />
            )}
          </div>
        )}

        {/* ---------- Questions ---------- */}
        <div className="mt-8 flex flex-col gap-8">
          {questions.map((q) => {
            const title = q.title || q.question || "Untitled question";
            const val = answers[q.id];

            return (
              <Field key={q.id} label={title} required={q.required}>
                {(q.type === "paragraph" || q.type === "short" || q.type === "long" || q.type === "text" || q.type === "email" || q.type === "phone" || !q.type) && (
                  <textarea
                    value={val || ""}
                    onChange={(e) => {
                      handleAnswerChange(q.id, e.target.value);
                      e.currentTarget.style.height = "auto";
                      e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                    }}
                    rows={2}
                    placeholder="Your answer…"
                    className="w-full resize-y rounded-lg border px-3 py-2.5 text-sm font-medium outline-none transition-colors leading-relaxed min-h-[50px]"
                    style={{
                      background: C.bg,
                      color: C.text,
                      border: `1px solid ${C.border}`,
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                  />
                )}

                {q.type === "single" && (
                  <div className="flex flex-col gap-2.5 w-full">
                    {(q.options || []).map((opt) => {
                      const active = val === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleAnswerChange(q.id, opt)}
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
                )}

                {q.type === "multiple" && (
                  <div className="flex flex-wrap gap-2.5">
                    {(q.options || []).map((opt) => {
                      const active = Array.isArray(val) && val.includes(opt);
                      const badge = opt.slice(0, 2).toUpperCase();
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleToggleMultiple(q.id, opt)}
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
                )}

                {q.type === "dropdown" && (
                  <Dropdown
                    value={val || ""}
                    onChange={(v) => handleAnswerChange(q.id, v)}
                    options={q.options || []}
                    placeholder="Select an option"
                  />
                )}

                {q.type === "date" && (
                  <IconInput icon={Calendar}>
                    <input
                      type="date"
                      value={val || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="flex-1 bg-transparent outline-none text-[14px] font-medium min-w-0"
                      style={{ color: val ? C.text : C.subtext }}
                    />
                  </IconInput>
                )}

                {q.type === "time" && (
                  <IconInput icon={Clock}>
                    <input
                      type="time"
                      value={val || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="flex-1 bg-transparent outline-none text-[14px] font-medium min-w-0"
                      style={{ color: val ? C.text : C.subtext }}
                    />
                  </IconInput>
                )}

                {q.type === "file" && (
                  <FileUpload
                    files={filesByQuestion[q.id] || []}
                    setFiles={(fn) => {
                      const prev = filesByQuestion[q.id] || [];
                      const next = typeof fn === "function" ? fn(prev) : fn;
                      handleFilesChange(q.id, next);
                    }}
                  />
                )}
              </Field>
            );
          })}
        </div>

        {/* ---------- Submit ---------- */}
        <button
          onClick={handleSubmit}
          disabled={applied || submitted || submitting}
          className="mt-10 w-full inline-flex items-center justify-center rounded-full py-3.5 text-[15px] font-semibold transition active:scale-[0.99] hover:opacity-90 disabled:opacity-50"
          style={{ background: C.primary, color: C.primaryFg }}
        >
          {submitted || applied
            ? "Submitted"
            : submitting
            ? "Submitting..."
            : "Submit registration"}
        </button>
      </div>
    </div>
  );
}

/* ---------- File upload with Cloudinary integration ---------- */

function formatSize(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileUpload({ files, setFiles }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const addFiles = async (list) => {
    if (!list || list.length === 0) return;
    const fileArray = Array.from(list);

    setUploading(true);
    for (const f of fileArray) {
      try {
        const formData = new FormData();
        formData.append("file", f);

        const res = await fetch("/api/forms/upload-file", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "File upload failed");
        }

        const data = await res.json();
        const uploadedObj = {
          id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: data.name || f.name,
          size: data.size || f.size,
          type: data.type || f.type,
          url: data.url,
          preview: f.type.startsWith("image/") ? data.url : null,
        };

        setFiles((prev) => [...prev, uploadedObj]);
      } catch (err) {
        console.error("Document upload error:", err);
        alert(`Failed to upload ${f.name}: ${err.message}`);
      }
    }
    setUploading(false);
  };

  const remove = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));

  return (
    <div className="w-full">
      {/* Drop zone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
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
        className="w-full flex flex-col items-center justify-center gap-2 rounded-2xl px-6 py-8 text-center transition-colors disabled:opacity-60"
        style={{
          background: dragging ? C.muted : C.bg,
          border: `1.5px dashed ${dragging ? C.primary : C.border}`,
        }}
      >
        <span className="h-11 w-11 rounded-full grid place-items-center" style={{ background: C.muted }}>
          <UploadCloud className="h-5 w-5" style={{ color: C.text }} />
        </span>
        <span className="text-[14px] font-semibold" style={{ color: C.text }}>
          {uploading ? "Uploading to Cloudinary..." : "Click to upload or drag & drop"}
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

/* ---------- Team picker with MongoDB Real User Fetching & Team Capacity Limit ---------- */

function TeamPicker({ team, setTeam, maxSize = 4, onClose }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [mongoUsers, setMongoUsers] = useState([]);
  const [fetching, setFetching] = useState(false);

  const isTeamFull = team.length >= maxSize;

  useEffect(() => {
    let ignore = false;
    const fetchUsers = async () => {
      setFetching(true);
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          if (!ignore && Array.isArray(data?.users)) {
            const formatted = data.users.map((u) => ({
              roll: u.rollNumber || u._id,
              name: u.name || "Student",
              branch: u.branch || "General",
              year: u.year || "Student",
              avatar: u.img || "/Profilepic.png",
            }));
            setMongoUsers(formatted);
          }
        }
      } catch (err) {
        console.error("Failed to fetch MongoDB users:", err);
      } finally {
        if (!ignore) setFetching(false);
      }
    };

    fetchUsers();
    return () => {
      ignore = true;
    };
  }, []);

  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return [];
    return mongoUsers
      .filter(
        (u) =>
          !team.some((t) => t.roll === u.roll) &&
          ((u.roll && String(u.roll).toLowerCase().includes(q)) ||
            (u.name && u.name.toLowerCase().includes(q)))
      )
      .slice(0, 5);
  }, [q, team, mongoUsers]);

  const add = (u) => {
    if (team.length >= maxSize) return;
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
            {isTeamFull
              ? `Team completed (${team.length}/${maxSize} members)`
              : `Search real users by roll number or name (${team.length}/${maxSize} members)`}
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
      {!isTeamFull && (
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
              placeholder="e.g. Roll number or Name"
              className="flex-1 bg-transparent outline-none text-[14px] font-medium min-w-0"
              style={{ color: C.text }}
            />
          </div>

          {focused && q.length > 0 && (
            <div
              className="absolute z-10 mt-1.5 w-full rounded-xl overflow-hidden shadow-lg"
              style={{ background: C.bg, border: `1px solid ${C.border}` }}
            >
              {fetching ? (
                <div className="px-4 py-3 text-[13px]" style={{ color: C.subtext }}>
                  Searching users from MongoDB...
                </div>
              ) : matches.length === 0 ? (
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
      )}

      {/* Selected members */}
      {team.length > 0 && (
        <div className="mt-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: C.subtext }}>
            Team ({team.length} / {maxSize})
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
