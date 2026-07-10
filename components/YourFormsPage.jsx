"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Eye,
  BarChart3,
  FileText,
  Clock,
  CheckCircle2,
  MessageSquareText,
  Trash2,
  Copy,
} from "lucide-react";
import { Icon } from "@iconify/react";
import ReliableImage from "@/components/ReliableImage";
import { DashboardEventsShell } from "@/components/DashboardEventsShell";
import { createDraft, deleteDraft, listDrafts, saveDraft } from "@/lib/drafts";
import { TopBar } from "./TopBarEvents";

const DEFAULT_FORM_COVER =
  "https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

function getFormId(form) {
  return form?._id?.toString?.() || form?.id?.toString?.() || "";
}

function isDraftForm(form) {
  return getFormId(form).startsWith("draft_");
}

function getFormCover(form) {
  return form?.image || form?.clubId?.logo || DEFAULT_FORM_COVER;
}

function formatUpdated(form) {
  const value = form?.updatedAt || form?.createdAt;
  if (!value) return "recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return date.toLocaleDateString();
}

function FormCard({ form, onDelete, onDuplicate }) {
  const router = useRouter();
  const id = getFormId(form);
  const isPublished = Boolean(form.isPublished);

  return (
    <div className="group flex flex-col gap-3 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 transition-shadow hover:shadow-md sm:flex-row sm:gap-4">
      <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-32">
        <ReliableImage
          src={getFormCover(form)}
          fallbackSrc={DEFAULT_FORM_COVER}
          alt={form.title || "Form"}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {isPublished ? (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs text-white sm:hidden">
            <CheckCircle2 className="size-3" /> Published
          </span>
        ) : (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white sm:hidden">
            <Clock className="size-3" /> Draft
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p>{form.title || "Untitled Form"}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {form.genre || "Event Registration"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isPublished ? (
              <span className="hidden items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs text-emerald-700 sm:inline-flex">
                <CheckCircle2 className="size-3" /> Published
              </span>
            ) : (
              <span className="hidden items-center gap-1 rounded-full bg-[var(--secondary)] px-2.5 py-1 text-xs text-[var(--secondary-foreground)] sm:inline-flex">
                <Clock className="size-3" /> Draft
              </span>
            )}
            <button
              className="grid size-7 place-items-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)]"
              onClick={() => onDuplicate(id)}
              type="button"
              title="Duplicate"
            >
              <Copy className="size-3.5" />
            </button>
            <button
              className="grid size-7 place-items-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-red-600"
              onClick={() => onDelete(id)}
              type="button"
              title="Delete"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
          {isPublished ? (
            <>
              <span className="flex items-center gap-1">
                <MessageSquareText className="size-3.5" />
                {Number(form.responses || form.registered || 0)} responses
              </span>
              <span className="flex items-center gap-1">
                <Eye className="size-3.5" />
                {Number(form.views || 0)} views
              </span>
            </>
          ) : (
            <span>Last edited {formatUpdated(form)}</span>
          )}
        </div>

        <div className="mt-auto flex gap-2">
          <button
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--border)] px-4 py-1.5 text-sm transition-colors hover:bg-[var(--accent)] sm:flex-none"
            onClick={() => router.push(`/FormBuilder/${id}`)}
            type="button"
          >
            <Pencil className="size-3.5" />
            Edit
          </button>
          {isPublished ? (
            <button
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-1.5 text-sm text-[var(--primary-foreground)] transition-opacity hover:opacity-90 sm:flex-none"
              onClick={() => router.push(`/analytics/${id}`)}
              type="button"
            >
              <BarChart3 className="size-3.5" />
              View Analytics
            </button>
          ) : (
            <button
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-1.5 text-sm text-[var(--primary-foreground)] transition-opacity hover:opacity-90 sm:flex-none"
              onClick={() => router.push(`/FormPreview/${id}`)}
              type="button"
            >
              <Eye className="size-3.5" />
              Preview
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function YourFormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState([]);
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadForms = async () => {
    let savedForms = [];

    try {
      setLoading(true);
      const res = await fetch("/api/forms/MINE", { cache: "no-store" });
      const payload = await res.json();

      savedForms = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.forms)
          ? payload.forms
          : [];
    } catch (error) {
      console.error("Failed to load forms", error);
    } finally {
      const drafts = listDrafts();
      setForms([...(drafts || []), ...savedForms]);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  const handleCreate = () => {
    const draft = createDraft();
    router.push(`/FormBuilder/${draft._id}`);
  };

  const deleteForm = async (id) => {
    const normalizedId = id?.toString?.() || "";

    if (!normalizedId || normalizedId.startsWith("draft_")) {
      deleteDraft(normalizedId);
      setForms((prev) => prev.filter((form) => getFormId(form) !== normalizedId));
      return;
    }

    try {
      const res = await fetch(`/api/forms/delete/${normalizedId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("This form is not saved in database yet");
        return;
      }

      setForms((prev) => prev.filter((form) => getFormId(form) !== normalizedId));
    } catch (error) {
      console.error(error);
    }
  };

  const duplicateForm = (id) => {
    const formToDuplicate = forms.find((form) => getFormId(form) === id);
    if (!formToDuplicate) return;

    const createdDraft = createDraft();
    const newDraft = {
      ...formToDuplicate,
      _id: createdDraft._id,
      title: `${formToDuplicate.title || "Untitled Form"} (Copy)`,
      isPublished: false,
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveDraft(newDraft);
    setForms((prev) => [newDraft, ...prev]);
  };

  const published = useMemo(() => forms.filter((form) => form.isPublished), [forms]);
  const drafts = useMemo(() => forms.filter((form) => !form.isPublished || isDraftForm(form)), [forms]);

  const stats = [
  {
    label: "Total Forms",
    value: forms.length,
    icon: "solar:document-bold",
  },
  {
    label: "Published",
    value: published.length,
    icon: "solar:verified-check-bold",
  },
  {
    label: "Total Responses",
    value: forms.reduce(
      (sum, form) => sum + Number(form.responses || form.registered || 0),
      0
    ),
    icon: "solar:chat-round-dots-bold",
  },
];

  const tabs = [
    { id: "all", label: `All (${forms.length})`, items: forms },
    { id: "published", label: `Published (${published.length})`, items: published },
    { id: "drafts", label: `Drafts (${drafts.length})`, items: drafts },
  ];

  const visible = tabs.find((item) => item.id === tab)?.items ?? forms;

  return (
    <DashboardEventsShell>
      <div className="flex flex-col gap-6 sm:gap-8">
        <TopBar showBack />

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[var(--muted-foreground)]">
              <span className="text-xs uppercase tracking-wider">Creator Studio</span>
            </div>
            <h1 className="text-[1.5rem] font-bold">Your Forms</h1>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
            onClick={handleCreate}
            type="button"
          >
            <Plus className="size-4" />
            Create Form
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {stats.map(({ label, value, icon }) => (
            <div
              key={label}
              className="flex flex-col gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 sm:gap-2 sm:p-4"
            >
              <div className="grid size-8 place-items-center rounded-lg bg-[var(--accent)] sm:size-9">
                <Icon icon={icon} className="size-4" />
              </div>
              <span className="text-xl sm:text-2xl">{value}</span>
              <span className="text-[11px] leading-tight text-[var(--muted-foreground)] sm:text-xs">
                {label}
              </span>
            </div>
          ))}
        </div>

        <div>
          <div className="grid w-full grid-cols-3 gap-1 rounded-full bg-[var(--muted)] p-1 sm:inline-grid sm:w-auto">
            {tabs.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`rounded-full px-3 py-1.5 text-xs transition-colors sm:text-sm ${
                  tab === item.id
                    ? "bg-[var(--background)] shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-foreground"
                }`}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {!loading && visible.length === 0 ? (
              <div className="events-empty-state">
                <img src="/eventsicons/NoFormsIll.svg" alt="No Forms" />
                <h2>No forms yet</h2>
                <p>Create your first form to get started</p>
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
                  onClick={handleCreate}
                  type="button"
                >
                  <Plus className="size-4" />
                  Create Form
                </button>
              </div>
            ) : (
              visible.map((form) => (
                <FormCard
                  key={getFormId(form)}
                  form={form}
                  onDelete={deleteForm}
                  onDuplicate={duplicateForm}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardEventsShell>
  );
}
