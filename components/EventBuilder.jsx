"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getDraft, saveDraft } from "@/lib/drafts";
import {
  AlignLeft,
  Calendar,
  CalendarDays,
  Check,
  CheckSquare,
  ChevronDown,
  Clock,
  Copy,
  Eye,
  GripVertical,
  ImageIcon,
  ListChecks,
  MapPin,
  Plus,
  Send,
  Trash2,
  Type,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import { Icon } from "@iconify/react";

/* ---------------- Palette ---------------- */

const C = {
  bg: "#ffffff",
  ink: "#111113",
  text: "#3a3a3d",
  subtext: "#8a8a90",
  border: "#ececee",
  line: "#f2f2f3",
  muted: "#f6f6f7",
  primary: "#111113",
  primaryFg: "#ffffff",
  accent: "#2c2c2e",
  danger: "#e5484d",
};

const POINT_LIMIT = 55;

/* ---------------- Types ---------------- */

const QUESTION_TYPES = [
  { type: "paragraph", label: "Paragraph", hint: "Long text answer", icon: AlignLeft },
  { type: "single", label: "Multiple choice", hint: "Pick one option", icon: ListChecks },
  { type: "multiple", label: "Multiple correct", hint: "Pick many options", icon: CheckSquare },
  { type: "dropdown", label: "Dropdown", hint: "Select from a list", icon: ChevronDown },
  { type: "date", label: "Date", hint: "Calendar picker", icon: CalendarDays },
  { type: "time", label: "Time", hint: "Time picker", icon: Clock },
  { type: "file", label: "File upload", hint: "Documents & images", icon: UploadCloud },
];

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

/* ============================================================= *
 *  App — Event Registration Form Builder
 * ============================================================= */

export default function App({ formId: propFormId }) {
  const router = useRouter();
  const params = useParams();
  const formId = propFormId || params?.formId;

  const [formMongoId, setFormMongoId] = useState(formId || "");
  const [banner, setBanner] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState([{ id: uid(), text: "" }]);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");

  const [isTeam, setIsTeam] = useState(false);
  const [teamSize, setTeamSize] = useState("4");

  const [questions, setQuestions] = useState([]);
  const [addOpen, setAddOpen] = useState(false);

  const [publishOpen, setPublishOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  /* points */
  const addPoint = () => {
    if (points.length >= 10) return;
    setPoints((prev) => [...prev, { id: uid(), text: "" }]);
  };

  const setPoint = (id, text) => {
    setPoints((prev) =>
      prev.map((point) =>
        point.id === id ? { ...point, text: text.slice(0, POINT_LIMIT) } : point
      )
    );
  };

  const removePoint = (id) => {
    setPoints((prev) => {
      const filtered = prev.filter((point) => point.id !== id);
      return filtered.length > 0 ? filtered : [{ id: uid(), text: "" }];
    });
  };

  /* questions */
  const addQuestion = (type) => {
    setQuestions((q) => [
      ...q,
      {
        id: uid(),
        type,
        title: "",
        options:
          type === "single" || type === "multiple" || type === "dropdown" || type === "checkbox"
            ? ["Option 1", "Option 2"]
            : [],
        required: false,
      },
    ]);
    setAddOpen(false);
  };

  const patchQuestion = (id, patch) =>
    setQuestions((q) => q.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const removeQuestion = (id) =>
    setQuestions((q) => q.filter((it) => it.id !== id));

  const duplicateQuestion = (id) =>
    setQuestions((q) => {
      const idx = q.findIndex((it) => it.id === id);
      if (idx < 0) return q;
      const next = [...q];
      next.splice(idx + 1, 0, { ...q[idx], id: uid() });
      return next;
    });

  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const reorder = (from, to) =>
    setQuestions((q) => {
      if (from === to || from < 0 || to < 0 || from >= q.length || to >= q.length) return q;
      const next = [...q];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  const canPreview = name.trim().length > 0;

  // Load existing form data or draft
  useEffect(() => {
    if (!formId) return;

    const loadForm = async () => {
      try {
        if (formId.startsWith("draft_")) {
          const draft = getDraft(formId);
          if (draft) {
            setFormMongoId(draft._id || formId);
            setName(draft.name || draft.title || "");
            setDescription(draft.description || "");
            setBanner(draft.banner || draft.image || null);
            setDate(draft.date || "");
            setTime(draft.time || "");
            setVenue(draft.venue || draft.location || "");
            setIsTeam(Boolean(draft.isTeam ?? draft.isTeamEvent));
            setTeamSize(String(draft.teamSize || "4"));
            setIsPublished(Boolean(draft.isPublished));
            if (Array.isArray(draft.points) && draft.points.length > 0) {
              setPoints(draft.points.map((p) => typeof p === "string" ? { id: uid(), text: p } : p));
            } else if (Array.isArray(draft.moreInformation) && draft.moreInformation.length > 0) {
              setPoints(draft.moreInformation.map((p) => ({ id: uid(), text: typeof p === "string" ? p : "" })));
            }
            if (Array.isArray(draft.questions)) {
              setQuestions(draft.questions.map((q) => ({
                id: q.id || uid(),
                type: q.type || "paragraph",
                title: q.title || q.question || "",
                options: Array.isArray(q.options) ? q.options : [],
                required: Boolean(q.required),
              })));
            }
            return;
          }
        }

        const res = await fetch(`/api/forms/${formId}`);
        if (res.ok) {
          const data = await res.json();
          setFormMongoId(data._id);
          setName(data.name || data.title || "");
          setDescription(data.description || "");
          setBanner(data.banner || data.image || null);
          setDate(data.date || "");
          setTime(data.time || "");
          setVenue(data.venue || data.location || "");
          setIsTeam(Boolean(data.isTeam ?? data.isTeamEvent));
          setTeamSize(String(data.teamSize || "4"));
          setIsPublished(Boolean(data.isPublished));

          if (Array.isArray(data.points) && data.points.length > 0) {
            setPoints(data.points.map((p) => typeof p === "string" ? { id: uid(), text: p } : p));
          } else if (Array.isArray(data.moreInformation) && data.moreInformation.length > 0) {
            setPoints(data.moreInformation.map((p) => ({ id: uid(), text: typeof p === "string" ? p : "" })));
          }

          if (Array.isArray(data.questions)) {
            setQuestions(data.questions.map((q) => ({
              id: q.id || uid(),
              type: q.type || "paragraph",
              title: q.title || q.question || "",
              options: Array.isArray(q.options) ? q.options : [],
              required: Boolean(q.required),
            })));
          }
        }
      } catch (err) {
        console.error("Error loading form:", err);
      }
    };

    loadForm();
  }, [formId]);

  // Save to draft if draft_...
  useEffect(() => {
    if (!formId || !formId.startsWith("draft_")) return;

    const draftData = {
      _id: formId,
      name,
      title: name,
      description,
      banner,
      image: banner,
      points: points.map((p) => p.text).filter(Boolean),
      moreInformation: points.map((p) => p.text).filter(Boolean),
      date,
      time,
      venue,
      location: venue,
      isTeam,
      isTeamEvent: isTeam,
      teamSize: Number(teamSize || 4),
      questions,
      updatedAt: new Date().toISOString(),
    };

    saveDraft(draftData);
  }, [formId, name, description, banner, points, date, time, venue, isTeam, teamSize, questions]);

  /* publish action */
  const handlePublish = async ({ clubId, visibility }) => {
    try {
      setIsPublishing(true);
      const isDraft = formMongoId?.startsWith("draft_");
      const cleanPoints = points.map((p) => p.text.trim()).filter(Boolean);

      const payload = {
        name: name.trim(),
        title: name.trim(),
        description: description.trim(),
        banner,
        image: banner,
        points: cleanPoints,
        moreInformation: cleanPoints,
        date,
        time,
        venue: venue.trim(),
        location: venue.trim(),
        isTeam,
        isTeamEvent: isTeam,
        teamSize: Number(teamSize || 4),
        questions,
        clubId: clubId || null,
        visibility: visibility || "everyone",
        isPublic: visibility !== "members",
        isPublished: true,
      };

      let res;
      if (isDraft) {
        res = await fetch("/api/forms/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/forms/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formId: formMongoId,
            formData: payload,
          }),
        });

        res = await fetch("/api/forms/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formId: formMongoId,
            clubId: clubId || null,
            visibility: visibility || "everyone",
          }),
        });
      }

      if (!res.ok) throw new Error("Publishing failed");
      const publishedForm = await res.json();

      if (formId?.startsWith("draft_")) {
        try {
          localStorage.removeItem(`draft-${formId}`);
        } catch (e) {}
      }

      setIsPublished(true);
      if (publishedForm?._id) setFormMongoId(publishedForm._id);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to publish event");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-full w-full" style={{ background: C.bg, color: C.text }}>
      {/* -------- Canvas -------- */}
      <main className="mx-auto w-full max-w-[720px] px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        <div className="mb-8">
          <h1 className="text-[26px] font-semibold tracking-tight sm:text-[32px]" style={{ color: C.ink }}>
            Build your event form
          </h1>
          <p className="mt-1.5 text-[14px]" style={{ color: C.subtext }}>
            Fill in the details, add questions, then publish.
          </p>
        </div>

        {/* Banner */}
        <BannerUpload banner={banner} setBanner={setBanner} />

        {/* Event basics */}
        <Section title="Event details" step="01" flush>
          <div className="flex flex-col gap-4">
            {/* Event name */}
            <FieldBlock label="Event name" icon={Type}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Inter-College Cricket Cup"
                className="w-full bg-transparent text-[19px] font-semibold tracking-tight outline-none placeholder:text-[#c2c2c7] placeholder:font-medium sm:text-[21px]"
                style={{ color: C.ink }}
              />
            </FieldBlock>

            {/* Description */}
            <FieldBlock label="Description" icon={AlignLeft}>
              <AutoTextarea
                value={description}
                onChange={setDescription}
                placeholder="Share a quick event overview…"
              />
            </FieldBlock>

            {/* Key information */}
            <FieldBlock
              label="Key information"
              icon={ListChecks}
              trailing={
                <span className="text-[11px] font-medium tabular-nums" style={{ color: C.subtext }}>
                  {points.filter((p) => p.text.trim()).length} added
                </span>
              }
            >
              <p className="mb-2.5 text-[12px]" style={{ color: C.subtext }}>
                Short highlights
              </p>
              <div className="flex flex-col gap-2">
                {points.map((p, i) => (
                  <PointRow
                    key={p.id}
                    index={i}
                    value={p.text}
                    onChange={(v) => setPoint(p.id, v)}
                    onRemove={() => removePoint(p.id)}
                    canRemove={points.length > 1 || p.text.length > 0}
                  />
                ))}
                <button
                  onClick={addPoint}
                  className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium transition hover:bg-[#eeeeef]"
                  style={{ background: C.muted, color: C.ink }}
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Add point
                </button>
              </div>
            </FieldBlock>
          </div>
        </Section>

        {/* When & where */}
        <Section title="When & where" step="02">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <DetailCard icon={Calendar} label="Date">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent text-[14px] font-medium outline-none"
                style={{ color: date ? C.ink : C.subtext }}
              />
            </DetailCard>
            <DetailCard icon={Clock} label="Time">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-transparent text-[14px] font-medium outline-none"
                style={{ color: time ? C.ink : C.subtext }}
              />
            </DetailCard>
            <DetailCard icon={MapPin} label="Venue">
              <input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Main Campus"
                className="w-full bg-transparent text-[14px] font-medium outline-none"
                style={{ color: C.ink }}
              />
            </DetailCard>
          </div>
        </Section>

        {/* Participation */}
        <Section title="Participation" step="03">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: C.muted }}>
                <Users className="h-5 w-5" style={{ color: C.ink }} />
              </span>
              <div className="min-w-0">
                <div className="text-[14.5px] font-semibold" style={{ color: C.ink }}>
                  Team-based event
                </div>
              </div>
            </div>
            <Toggle on={isTeam} onChange={setIsTeam} />
          </div>

          {isTeam && (
            <div
              className="mt-4 flex flex-col gap-3 rounded-2xl px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              style={{ background: C.muted, animation: "item-in 220ms ease" }}
            >
              <div>
                <div className="text-[13.5px] font-semibold" style={{ color: C.ink }}>
                  Members per team
                </div>
                <div className="text-[12px]" style={{ color: C.subtext }}>
                  Including the team lead.
                </div>
              </div>
              <Stepper value={teamSize} onChange={setTeamSize} min={2} max={20} />
            </div>
          )}
        </Section>

        {/* Questions */}
        <Section title="Registration questions" step="04" flush>
          <div className="flex flex-col gap-3">
            {questions.map((q, i) => (
              <QuestionEditor
                key={q.id}
                index={i}
                q={q}
                onPatch={(p) => patchQuestion(q.id, p)}
                onRemove={() => removeQuestion(q.id)}
                onDuplicate={() => duplicateQuestion(q.id)}
                dragging={dragIndex === i}
                dragOver={overIndex === i && dragIndex !== null && dragIndex !== i}
                onDragStart={() => setDragIndex(i)}
                onDragEnter={() => setOverIndex(i)}
                onDrop={() => {
                  if (dragIndex !== null) reorder(dragIndex, i);
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
              />
            ))}

            {questions.length === 0 && (
              <div className="rounded-2xl px-6 py-10 text-center" style={{ border: `1.5px dashed ${C.border}` }}>
                <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl" style={{ background: C.muted }}>
                  <ListChecks className="h-5 w-5" style={{ color: C.ink }} />
                </div>
                <div className="mt-3 text-[14.5px] font-semibold" style={{ color: C.ink }}>
                  No questions yet
                </div>
                <div className="mx-auto mt-1 max-w-xs text-[13px]" style={{ color: C.subtext }}>
                  Add text answers, multiple choice, file uploads and more.
                </div>
              </div>
            )}

            <div className="relative">
              <button
                onClick={() => setAddOpen((o) => !o)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[14px] font-medium transition active:scale-[0.995]"
                style={{
                  background: addOpen ? C.ink : C.bg,
                  color: addOpen ? C.primaryFg : C.ink,
                  border: `1.5px ${addOpen ? "solid" : "dashed"} ${addOpen ? C.ink : C.border}`,
                }}
              >
                <Plus className={`h-4 w-4 transition-transform ${addOpen ? "rotate-45" : ""}`} strokeWidth={2.5} />
                Add question
              </button>

              {addOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setAddOpen(false)} />
                  <div
                    className="absolute bottom-full z-20 mb-2 w-full overflow-hidden rounded-2xl p-1.5"
                    style={{ background: C.bg, border: `1px solid ${C.border}`, boxShadow: "0 16px 40px rgba(0,0,0,0.12)", animation: "modal-in 160ms ease" }}
                  >
                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                      {QUESTION_TYPES.map((t) => (
                        <button
                          key={t.type}
                          onClick={() => addQuestion(t.type)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition"
                          onMouseEnter={(e) => (e.currentTarget.style.background = C.muted)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ background: C.muted }}>
                            <t.icon className="h-4.5 w-4.5" style={{ color: C.ink }} />
                          </span>
                          <div className="min-w-0">
                            <div className="text-[13.5px] font-semibold" style={{ color: C.ink }}>
                              {t.label}
                            </div>
                            <div className="truncate text-[11.5px]" style={{ color: C.subtext }}>
                              {t.hint}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </Section>

        {/* Bottom actions */}
        <div className="mt-10">
  <div className="flex w-full flex-row gap-2.5">
    <button
      onClick={() => setPreviewOpen(true)}
      disabled={canPreview}
      className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-semibold transition-all duration-200 hover:bg-[#f6f6f7] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:gap-2 sm:rounded-full sm:px-6 sm:py-3.5"
      style={{ color: C.ink, borderColor: C.border }}
    >
      <Eye className="h-4 w-4 shrink-0" />
      <span className="truncate">Preview</span>
    </button>

    <button
      onClick={() => setPublishOpen(true)}
      className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.98] sm:gap-2 sm:rounded-full sm:px-6 sm:py-3.5"
      style={{
        background: C.primary,
        color: C.primaryFg,
        boxShadow: "0 6px 18px rgba(0,0,0,0.14)",
      }}
    >
      <Send className="h-4 w-4 shrink-0" />
      <span className="truncate">Publish event</span>
    </button>
  </div>

  <p
    className="mt-4 text-center text-[11px] sm:text-xs"
    style={{ color: C.subtext }}
  >
    You can edit the form after publishing.
  </p>
</div>
      </main>

      {publishOpen && (
        <PublishModal
          eventName={name.trim() || "your event"}
          onClose={() => setPublishOpen(false)}
          onPublish={handlePublish}
          isPublishing={isPublishing}
          published={isPublished}
        />
      )}
      {previewOpen && (
        <PreviewModal
          onClose={() => setPreviewOpen(false)}
          data={{ banner, name, description, points, date, time, venue, isTeam, teamSize, questions }}
        />
      )}
    </div>
  );
}

/* ============================================================= *
 *  Layout primitives
 * ============================================================= */

function Section({
  title,
  step,
  children,
  flush,
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold tabular-nums"
          style={{ background: C.muted, color: C.subtext }}
        >
          {step}
        </span>
        <h2 className="text-[15px] font-semibold tracking-tight" style={{ color: C.ink }}>
          {title}
        </h2>
      </div>
      {flush ? (
        children
      ) : (
        <div className="rounded-2xl p-4 sm:p-5" style={{ border: `1px solid ${C.border}` }}>
          {children}
        </div>
      )}
    </section>
  );
}

function FieldBlock({
  label,
  icon: Icon,
  trailing,
  children,
}) {
  return (
    <div className="rounded-2xl p-4 sm:p-[18px]" style={{ border: `1px solid ${C.border}`, background: C.bg }}>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5" style={{ color: C.subtext }} strokeWidth={2.25} />
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: C.subtext }}>
            {label}
          </span>
        </div>
        {trailing}
      </div>
      {children}
    </div>
  );
}

function PointRow({
  index,
  value,
  onChange,
  onRemove,
  canRemove,
}) {
  const [focus, setFocus] = useState(false);
  const near = value.length >= POINT_LIMIT - 8;
  return (
    <div
      className="group flex items-center gap-2.5 rounded-xl py-2 pl-3 pr-2 transition-all"
      style={{
        background: focus ? C.bg : C.muted,
        border: `1px solid ${focus ? C.ink : "transparent"}`,
      }}
    >
      <span
        className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-[10px] font-semibold tabular-nums"
        style={{ background: focus ? C.ink : "#e4e4e6", color: focus ? C.primaryFg : C.subtext }}
      >
        {index + 1}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        maxLength={POINT_LIMIT}
        placeholder={index === 0 ? "e.g. Cash prizes worth ₹50,000" : "Add another highlight"}
        className="min-w-0 flex-1 bg-transparent text-[13.5px] font-medium outline-none placeholder:text-[#b6b6bb]"
        style={{ color: C.ink }}
      />
      <span
        className="shrink-0 text-[10.5px] tabular-nums transition-opacity"
        style={{
          color: value.length >= POINT_LIMIT ? C.danger : C.subtext,
          opacity: focus || near ? 1 : 0,
        }}
      >
        {value.length}/{POINT_LIMIT}
      </span>
      {canRemove && (
        <button
          onClick={onRemove}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full transition hover:bg-[#e6e6e8]"
          style={{ color: C.subtext }}
          aria-label="Remove point"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function AutoTextarea({
  value,
  onChange,
  placeholder,
  minRows = 2,
}) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={minRows}
      placeholder={placeholder}
      className="w-full resize-none bg-transparent text-[14px] font-medium leading-relaxed outline-none"
      style={{ color: C.ink }}
    />
  );
}

function BannerUpload({ banner, setBanner }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handle = async (list) => {
    const f = list?.[0];
    if (!f || !f.type.startsWith("image/")) return;

    try {
      setUploading(true);
      const payload = new FormData();
      payload.append("file", f);

      const res = await fetch("/api/forms/upload-image", {
        method: "POST",
        body: payload,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to upload banner image");
      }

      const data = await res.json();
      setBanner(data.url);
    } catch (err) {
      console.error("Banner upload error:", err);
      alert(err.message || "Could not upload image");
    } finally {
      setUploading(false);
    }
  };

  if (banner) {
    return (
      <div className="relative overflow-hidden rounded-2xl" style={{ border: `1px solid ${C.border}`, background: C.muted }}>
        <img src={banner} alt="Event banner" className="h-48 w-full object-cover sm:h-60" />
        <div className="absolute right-3 top-3 flex gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-full px-3 py-1.5 text-[12px] font-medium shadow-sm backdrop-blur transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "rgba(255,255,255,0.94)", color: C.ink }}
          >
            {uploading ? "Uploading..." : "Replace"}
          </button>
          <button
            onClick={() => setBanner(null)}
            className="grid h-8 w-8 place-items-center rounded-full shadow-sm backdrop-blur transition hover:opacity-90"
            style={{ background: "rgba(255,255,255,0.94)", color: C.ink }}
            aria-label="Remove banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { handle(e.target.files); e.currentTarget.value = ""; }} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={uploading}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files); }}
      className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-2xl transition-colors sm:h-52"
      style={{ background: dragging ? C.muted : C.bg, border: `1.5px dashed ${dragging ? C.ink : C.border}` }}
    >
      <span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: C.muted }}>
        <Icon icon="solar:gallery-linear" className="h-5 w-5" style={{ color: C.ink }} />
      </span>
      <span className="text-[14px] font-semibold" style={{ color: C.ink }}>
        {uploading ? "Uploading to Cloudinary..." : "Add event banner"}
      </span>
      <span className="text-[12px]" style={{ color: C.subtext }}>
        Tap to upload · 16:9 recommended
      </span>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { handle(e.target.files); e.currentTarget.value = ""; }} />
    </button>
  );
}

function DetailCard({ icon: Icon, label, children }) {
  return (
    <div className="rounded-xl px-3.5 py-3" style={{ background: C.muted }}>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color: C.subtext }} />
        <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.subtext }}>
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onChange, size = "md" }) {
  const dims =
    size === "sm"
      ? { w: 40, h: 24, k: 18, pad: 3 }
      : { w: 46, h: 26, k: 20, pad: 3 };
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="relative shrink-0 rounded-full transition-colors duration-200 ease-out"
      style={{
        width: dims.w,
        height: dims.h,
        background: on ? C.ink : "#e2e2e5",
        boxShadow: on ? "inset 0 0 0 1px rgba(0,0,0,0.06)" : "inset 0 0 0 1px rgba(0,0,0,0.05)",
      }}
      aria-pressed={on}
    >
      <span
        className="absolute rounded-full bg-white transition-all duration-200 ease-out"
        style={{
          top: dims.pad,
          width: dims.k,
          height: dims.k,
          left: on ? dims.w - dims.k - dims.pad : dims.pad,
          boxShadow: "0 1px 3px rgba(0,0,0,0.25), 0 1px 1px rgba(0,0,0,0.08)",
        }}
      />
    </button>
  );
}

function Stepper({ value, onChange, min, max }) {
  const n = parseInt(value || "0", 10) || min;
  const set = (v) => onChange(String(Math.max(min, Math.min(max, v))));
  return (
    <div className="inline-flex items-center gap-1 self-start rounded-full bg-white p-1 sm:self-auto" style={{ border: `1px solid ${C.border}` }}>
      <button onClick={() => set(n - 1)} className="grid h-8 w-8 place-items-center rounded-full text-[18px] font-medium transition hover:bg-[#f3f3f4]" style={{ color: C.ink }}>−</button>
      <span className="w-8 text-center text-[15px] font-semibold tabular-nums" style={{ color: C.ink }}>{n}</span>
      <button onClick={() => set(n + 1)} className="grid h-8 w-8 place-items-center rounded-full text-[18px] font-medium transition hover:bg-[#f3f3f4]" style={{ color: C.ink }}>+</button>
    </div>
  );
}

/* ---------------- Question editor ---------------- */

function QuestionEditor({
  index,
  q,
  onPatch,
  onRemove,
  onDuplicate,
  dragging,
  dragOver,
  onDragStart,
  onDragEnter,
  onDrop,
  onDragEnd,
}) {
const meta = QUESTION_TYPES.find((t) => t.type === q.type) || QUESTION_TYPES[0];
const hasOptions =
  q.type === "single" ||
  q.type === "multiple" ||
  q.type === "dropdown" ||
  q.type === "checkbox";

const [armed, setArmed] = useState(false);

const setOption = (i, v) =>
  onPatch({
    options: q.options.map((o, idx) => (idx === i ? v : o)),
  });

const addOption = () =>
  onPatch({
    options: [...q.options, `Option ${q.options.length + 1}`],
  });

const removeOption = (i) =>
  onPatch({
    options: q.options.filter((_, idx) => idx !== i),
  });
  return (
    <div
      draggable={armed}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        onDragEnter();
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      onDragEnd={() => {
        setArmed(false);
        onDragEnd();
      }}
      className="rounded-2xl p-4 transition-all sm:p-5"
      style={{
        border: `1px solid ${dragOver ? C.ink : C.border}`,
        background: C.bg,
        opacity: dragging ? 0.5 : 1,
        boxShadow: dragOver ? "0 8px 24px rgba(0,0,0,0.10)" : "none",
        transform: dragOver ? "scale(1.006)" : "none",
        animation: "item-in 220ms ease",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            onPointerDown={() => setArmed(true)}
            onPointerUp={() => setArmed(false)}
            onPointerLeave={() => setArmed(false)}
            className="-ml-1 grid h-8 w-6 shrink-0 cursor-grab touch-none place-items-center rounded-md transition hover:bg-[#f3f3f4] active:cursor-grabbing"
            style={{ color: "#c2c2c7" }}
            aria-label="Drag to reorder"
            title="Drag to reorder"
          >
            <GripVertical className="h-4.5 w-4.5" />
          </button>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: C.muted, color: C.ink }}
          >
            <meta.icon className="h-3.5 w-3.5" />
            {meta.label}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <IconBtn label="Duplicate" onClick={onDuplicate}>
            <Copy className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Delete" onClick={onRemove} danger>
            <Trash2 className="h-4 w-4" />
          </IconBtn>
        </div>
      </div>

      <input
        value={q.title}
        onChange={(e) => onPatch({ title: e.target.value })}
        placeholder="Type your question…"
        className="mt-3 w-full bg-transparent text-[16px] font-semibold tracking-tight outline-none"
        style={{ color: C.ink }}
      />

      <div className="mt-3.5">
        {q.type === "paragraph" && (
          <div className="rounded-lg px-3.5 py-2.5 text-[13px]" style={{ background: C.muted, color: C.subtext }}>
            Long answer text
          </div>
        )}

        {hasOptions && (
          <div className="flex flex-col gap-2">
            {q.options.map((opt, i) => (
              <OptionRow
                key={i}
                type={q.type}
                index={i}
                value={opt}
                onChange={(v) => setOption(i, v)}
                onRemove={() => removeOption(i)}
                canRemove={q.options.length > 1}
              />
            ))}
            <button
              onClick={addOption}
              className="mt-1 flex items-center gap-2.5 rounded-xl border border-dashed px-3 py-2.5 text-[13px] font-medium transition hover:bg-[#fafafa]"
              style={{ borderColor: C.border, color: C.subtext }}
            >
              <span className="grid h-5 w-5 place-items-center rounded-full" style={{ background: C.muted }}>
                <Plus className="h-3 w-3" strokeWidth={2.5} style={{ color: C.ink }} />
              </span>
              Add option
            </button>
          </div>
        )}

        {q.type === "date" && (
          <div className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-[13px]" style={{ background: C.muted, color: C.subtext }}>
            <Calendar className="h-4 w-4" /> Date picker
          </div>
        )}
        {q.type === "time" && (
          <div className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-[13px]" style={{ background: C.muted, color: C.subtext }}>
            <Clock className="h-4 w-4" /> Time picker
          </div>
        )}
        {q.type === "file" && (
          <div className="flex items-center gap-2.5 rounded-lg px-3.5 py-3 text-[13px]" style={{ background: C.muted, color: C.subtext }}>
            <UploadCloud className="h-4.5 w-4.5" /> Upload documents · PDF, DOCX, images
          </div>
        )}
      </div>

      <div className="mt-3.5 flex items-center justify-end gap-2.5 border-t pt-3" style={{ borderColor: C.line }}>
        <span className="text-[12.5px] font-medium" style={{ color: C.subtext }}>Required</span>
        <Toggle on={q.required} onChange={(v) => onPatch({ required: v })} size="sm" />
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  danger,
  disabled,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-full transition disabled:opacity-25"
      style={{ color: danger ? C.danger : C.subtext }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = danger ? "#fdecec" : C.muted; }}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {children}
    </button>
  );
}

function OptionRow({
  type,
  index,
  value,
  onChange,
  onRemove,
  canRemove,
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div
      className="group flex items-center gap-3 rounded-xl py-2 pl-3 pr-2 transition-all"
      style={{ background: focus ? C.bg : C.muted, border: `1px solid ${focus ? C.ink : "transparent"}` }}
    >
      <span className="grid h-5 w-5 shrink-0 place-items-center" style={{ color: C.subtext }}>
        {type === "single" && <span className="h-[18px] w-[18px] rounded-full" style={{ border: `2px solid ${C.border}` }} />}
        {type === "multiple" && <span className="h-[18px] w-[18px] rounded-[6px]" style={{ border: `2px solid ${C.border}` }} />}
        {type === "dropdown" && (
          <span
            className="grid h-[18px] w-[18px] place-items-center rounded-md text-[10px] font-semibold tabular-nums"
            style={{ background: "#e4e4e6", color: C.subtext }}
          >
            {index + 1}
          </span>
        )}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholder={`Option ${index + 1}`}
        className="min-w-0 flex-1 bg-transparent text-[13.5px] font-medium outline-none placeholder:text-[#b6b6bb]"
        style={{ color: C.ink }}
      />
      {canRemove && (
        <button
          onClick={onRemove}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[color:var(--subtext)] opacity-60 transition hover:bg-[#e6e6e8] hover:opacity-100"
          style={{ color: C.subtext }}
          aria-label="Remove option"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/* ============================================================= *
 *  Publish modal (drawer on mobile, dialog on desktop)
 * ============================================================= */

function PublishModal({ eventName, onClose, onPublish, isPublishing, published }) {
  const router = useRouter();
  const [clubs, setClubs] = useState([]);
  const [club, setClub] = useState(null);
  const [clubOpen, setClubOpen] = useState(false);
  const [audience, setAudience] = useState("public");

  useEffect(() => {
    let ignore = false;
    fetch("/api/clubs?memberOf=true")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (ignore) return;
        const fetchedClubs = Array.isArray(data?.clubs)
          ? data.clubs.map((c) => ({
              id: c._id,
              name: c.clubName,
              handle: c.roleLabel || c.position || "Club",
              logo: c.logo || "/Defaultclublogo.svg",
            }))
          : [];
        setClubs(fetchedClubs);
        if (fetchedClubs.length > 0) {
          setClub(fetchedClubs[0]);
        }
      })
      .catch((err) => console.error("Fetch clubs error:", err));

    return () => {
      ignore = true;
    };
  }, []);

  const handlePublishClick = () => {
    onPublish({ clubId: club?.id || null, visibility: audience });
  };

  const handleDoneClick = () => {
    onClose();
    router.push("/dashboard/events/yourform");
  };

  return (
    <Overlay onClose={onClose}>
      <div
        className="flex w-full flex-col overflow-hidden rounded-t-3xl bg-white sm:mx-auto sm:max-w-[430px] sm:rounded-[28px]"
        style={{ border: `1px solid ${C.border}`, boxShadow: "0 24px 70px rgba(0,0,0,0.24)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 sm:hidden">
          <span className="h-1.5 w-10 rounded-full" style={{ background: C.border }} />
        </div>

        {published ? (
          <div className="px-6 py-11 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full" style={{ background: C.ink, animation: "modal-in 220ms ease" }}>
              <Check className="h-7 w-7" style={{ color: C.primaryFg }} strokeWidth={3} />
            </div>
            <h3 className="mt-4 text-[20px] font-semibold tracking-tight" style={{ color: C.ink }}>Event published</h3>
            <p className="mx-auto mt-1.5 max-w-xs text-[13.5px] leading-relaxed" style={{ color: C.subtext }}>
              <span className="font-semibold" style={{ color: C.ink }}>{eventName}</span> is now live {club?.name ? `under ${club.name}` : ""} for {audience === "public" ? "everyone" : "club members"}.
            </p>
            <button onClick={handleDoneClick} className="mt-6 w-full rounded-full py-3.5 text-[15px] font-medium transition hover:opacity-90" style={{ background: C.primary, color: C.primaryFg }}>
              Done
            </button>
          </div>
        ) : (
          <>
            {/* header */}
            <div className="flex items-start justify-between px-6 pb-4 pt-6">
              <div>
                <h3 className="text-[19px] font-semibold tracking-tight" style={{ color: C.ink }}>Publish event</h3>
                <p className="mt-1 text-[13px]" style={{ color: C.subtext }}>Publish under a club and choose the audience.</p>
              </div>
              <button onClick={onClose} className="-mr-1.5 -mt-1 grid h-9 w-9 place-items-center rounded-full transition hover:bg-[#f3f3f4]" aria-label="Close">
                <X className="h-4.5 w-4.5" style={{ color: C.subtext }} />
              </button>
            </div>

            <div className="h-px" style={{ background: C.line }} />

            <div className="px-6 py-5">
              {/* Club select */}
              <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: C.subtext }}>
                Publishing as
              </div>
              <div className="relative">
                {club ? (
                  <button
                    onClick={() => setClubOpen((o) => !o)}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors"
                    style={{ background: C.muted, border: `1px solid ${clubOpen ? C.ink : "transparent"}` }}
                  >
                    <img src={club.logo} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" style={{ background: "#e4e4e6" }} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14.5px] font-semibold" style={{ color: C.ink }}>{club.name}</div>
                      <div className="truncate text-[12px]" style={{ color: C.subtext }}>{club.handle}</div>
                    </div>
                    <ChevronDown className="h-4.5 w-4.5 shrink-0 transition-transform" style={{ color: C.subtext, transform: clubOpen ? "rotate(180deg)" : "none" }} />
                  </button>
                ) : (
                  <div className="rounded-2xl px-4 py-3 text-[13.5px]" style={{ background: C.muted, color: C.subtext }}>
                    Publishing as personal event
                  </div>
                )}

                {clubOpen && clubs.length > 0 && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setClubOpen(false)} />
                    <div
                      className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl bg-white p-1.5"
                      style={{ border: `1px solid ${C.border}`, boxShadow: "0 16px 40px rgba(0,0,0,0.14)", animation: "modal-in 150ms ease" }}
                    >
                      {clubs.map((c) => {
                        const active = c.id === club?.id;
                        return (
                          <button
                            key={c.id}
                            onClick={() => { setClub(c); setClubOpen(false); }}
                            className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition"
                            onMouseEnter={(e) => (e.currentTarget.style.background = C.muted)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <img src={c.logo} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" style={{ background: "#e4e4e6" }} />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[14px] font-semibold" style={{ color: C.ink }}>{c.name}</div>
                              <div className="truncate text-[12px]" style={{ color: C.subtext }}>{c.handle}</div>
                            </div>
                            {active && (
                              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full" style={{ background: C.ink }}>
                                <Check className="h-3 w-3 text-white" strokeWidth={3} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Audience */}
              <div className="mt-5">
                <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: C.subtext }}>Publish for</div>
                <div className="flex flex-col gap-2.5">
                  <AudienceOption active={audience === "members"} onClick={() => setAudience("members")} title="Club members" desc="Only members of this club can register." icon={Users} />
                  <AudienceOption active={audience === "public"} onClick={() => setAudience("public")} title="Public" desc="Anyone with the link can register." icon={Eye} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6 pt-1">
              <button onClick={onClose} className="flex-1 rounded-full py-3.5 text-[14px] font-medium transition hover:bg-[#f3f3f4]" style={{ color: C.ink, border: `1px solid ${C.border}` }}>
                Cancel
              </button>
              <button
                onClick={handlePublishClick}
                disabled={isPublishing}
                className="flex-1 rounded-full py-3.5 text-[14px] font-medium transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
                style={{ background: C.primary, color: C.primaryFg }}
              >
                {isPublishing ? "Publishing..." : "Publish"}
              </button>
            </div>
          </>
        )}
      </div>
    </Overlay>
  );
}

function AudienceOption({ active, onClick, title, desc, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all"
      style={{ background: active ? C.ink : C.bg, border: `1px solid ${active ? C.ink : C.border}` }}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ background: active ? "rgba(255,255,255,0.14)" : C.muted }}>
        <Icon className="h-4.5 w-4.5" style={{ color: active ? C.primaryFg : C.ink }} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold" style={{ color: active ? C.primaryFg : C.ink }}>{title}</div>
        <div className="text-[12px]" style={{ color: active ? "rgba(255,255,255,0.65)" : C.subtext }}>{desc}</div>
      </div>
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full" style={{ border: `1.5px solid ${active ? C.primaryFg : C.border}` }}>
        {active && <span className="h-2.5 w-2.5 rounded-full" style={{ background: C.primaryFg }} />}
      </span>
    </button>
  );
}

/* ============================================================= *
 *  Preview modal
 * ============================================================= */

function PreviewModal({
  onClose,
  data,
}) {
  const fmtDate = data.date
    ? new Date(data.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "—";
  const fmtTime = data.time
    ? new Date("2000-01-01T" + data.time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "—";

  const info = [
    { icon: Calendar, label: "Date", value: fmtDate },
    { icon: Clock, label: "Time", value: fmtTime },
    { icon: MapPin, label: "Venue", value: data.venue || "—" },
  ];

  const bullets = data.points.map((p) => p.text.trim()).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50" style={{ animation: "overlay-in 160ms ease" }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6" style={{ background: "rgba(255,255,255,0.9)", borderBottom: `1px solid ${C.line}`, backdropFilter: "blur(8px)" }}>
          <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: C.ink }}>
            <Eye className="h-4 w-4" /> Preview
          </div>
          <button onClick={onClose} className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium transition hover:bg-[#f3f3f4]" style={{ color: C.ink, border: `1px solid ${C.border}` }}>
            <X className="h-4 w-4" /> Close
          </button>
        </div>

        <div className="scroll-area min-h-0 flex-1 overflow-y-auto" style={{ background: C.bg }}>
          <div className="mx-auto w-full max-w-[600px] px-3 py-8 sm:py-10">
            {/* banner */}
            <div style={{ background: C.muted, borderRadius: 28, border: `1px solid ${C.border}` }}>
              <div className="flex items-center px-3.5 pb-2.5 pt-3">
                <div className="flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3" style={{ background: "rgb(235,235,237)" }}>
                  <span className="grid h-5 w-5 place-items-center rounded-full" style={{ background: C.accent }}>
                    <Users className="h-3 w-3 text-white" />
                  </span>
                  <span className="text-[12px] font-medium" style={{ color: C.accent }}>Your Club</span>
                </div>
              </div>
              <div className="mx-2.5 overflow-hidden" style={{ height: 230, borderRadius: 20, border: `1px solid ${C.border}`, background: "#efeff2" }}>
                {data.banner ? <img src={data.banner} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center"><ImageIcon className="h-8 w-8" style={{ color: C.border }} /></div>}
              </div>
              <div className="flex justify-center">
                <div className="text-[13px] font-medium text-white" style={{ background: C.accent, border: "3px solid #fff", borderRadius: 999, padding: "7px 22px", margin: "12px 0 -16px" }}>
                  {fmtDate}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl" style={{ color: C.ink }}>{data.name.trim() || "Untitled event"}</h1>
              {data.description.trim() && <p className="mt-1.5 text-[14px]" style={{ color: C.subtext }}>{data.description.trim()}</p>}
            </div>

            {bullets.length > 0 && (
              <ul className="mt-4 flex flex-col gap-2">
                {bullets.map((l, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13.5px]" style={{ color: C.text }}>
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: C.ink }} />
                    {l}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
              {info.map((it) => (
                <div key={it.label} className="rounded-2xl p-3 sm:p-4" style={{ border: `1px solid ${C.border}` }}>
                  <div className="mb-2 grid h-8 w-8 place-items-center rounded-full sm:mb-3" style={{ background: C.muted }}>
                    <it.icon className="h-4 w-4" style={{ color: C.ink }} />
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide sm:text-[11px]" style={{ color: C.subtext }}>{it.label}</div>
                  <div className="mt-0.5 text-[13px] font-semibold leading-snug sm:text-[15px]" style={{ color: C.ink }}>{it.value}</div>
                </div>
              ))}
            </div>

            {data.isTeam && (
              <div className="mt-6 rounded-2xl p-4" style={{ background: C.accent }}>
                <div className="text-[15px] font-semibold text-white">Team registration</div>
                <div className="mt-0.5 text-[12px]" style={{ color: "rgba(255,255,255,0.6)" }}>Register a team of {data.teamSize} members.</div>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-8">
              {data.questions.map((q) => <PreviewField key={q.id} q={q} />)}
              {data.questions.length === 0 && <p className="text-center text-[13px]" style={{ color: C.subtext }}>No questions added yet.</p>}
            </div>

            <button className="mt-10 w-full rounded-full py-3.5 text-[15px] font-medium text-white transition hover:opacity-90" style={{ background: C.primary }}>
              Submit registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewField({ q }) {
  const label = q.title.trim() || "Untitled question";
  return (
    <div>
      <label className="mb-3 block text-base sm:text-[19px]" style={{ color: C.ink }}>
        {label}
        {q.required && <span style={{ color: C.danger }}> *</span>}
      </label>

      {q.type === "paragraph" && (
        <textarea rows={2} placeholder="Your answer…" className="w-full resize-none rounded-lg border px-3 py-2.5 text-sm font-medium outline-none" style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}` }} />
      )}

      {q.type === "single" && (
        <div className="flex flex-col gap-2.5">
          {q.options.map((o, i) => (
            <button key={i} className="inline-flex h-11 w-full items-center rounded-full px-5 text-[14px] font-medium" style={{ color: C.text, border: `1px solid ${C.border}` }}>{o}</button>
          ))}
        </div>
      )}

      {q.type === "multiple" && (
        <div className="flex flex-wrap gap-2.5">
          {q.options.map((o, i) => (
            <button key={i} className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13px] font-medium" style={{ color: C.text, border: `1px solid ${C.border}` }}>
              <span className="h-4 w-4 rounded-[5px]" style={{ border: `1.5px solid ${C.border}` }} />{o}
            </button>
          ))}
        </div>
      )}

      {q.type === "dropdown" && (
        <div className="flex h-10 w-full items-center justify-between rounded-lg px-3 text-[14px] font-medium" style={{ color: C.subtext, border: `1px solid ${C.border}` }}>
          Select an option <ChevronDown className="h-4 w-4" style={{ color: C.subtext }} />
        </div>
      )}

      {q.type === "date" && (
        <div className="flex h-10 w-full items-center gap-2 rounded-lg px-3" style={{ border: `1px solid ${C.border}` }}>
          <Calendar className="h-4 w-4" style={{ color: C.subtext }} /><span className="text-[14px] font-medium" style={{ color: C.subtext }}>Select a date</span>
        </div>
      )}
      {q.type === "time" && (
        <div className="flex h-10 w-full items-center gap-2 rounded-lg px-3" style={{ border: `1px solid ${C.border}` }}>
          <Clock className="h-4 w-4" style={{ color: C.subtext }} /><span className="text-[14px] font-medium" style={{ color: C.subtext }}>Select a time</span>
        </div>
      )}
      {q.type === "file" && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl px-6 py-8 text-center" style={{ border: `1.5px dashed ${C.border}` }}>
          <span className="grid h-11 w-11 place-items-center rounded-full" style={{ background: C.muted }}>
            <UploadCloud className="h-5 w-5" style={{ color: C.ink }} />
          </span>
          <span className="text-[14px] font-semibold" style={{ color: C.ink }}>Click to upload or drag &amp; drop</span>
          <span className="text-[12px]" style={{ color: C.subtext }}>Images, PDF or DOCX · up to 10MB each</span>
        </div>
      )}
    </div>
  );
}

/* ---------------- Overlay ---------------- */

function Overlay({ children, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" style={{ animation: "overlay-in 160ms ease" }} onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full sm:w-auto" style={{ animation: "drawer-in 260ms cubic-bezier(0.22,1,0.36,1)" }}>
        {children}
      </div>
    </div>
  );
}
