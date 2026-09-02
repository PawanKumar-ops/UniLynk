"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@iconify/react"
import { ArrowLeft } from "lucide-react"
import { DashboardEventsShell } from "@/components/DashboardEventsShell"
import "@/app/dashboard/dashboard.css"
import "@/components/events-pages.css"

/* ------------------------------------------------------------------ *
 * Types & seed data
 * ------------------------------------------------------------------ */

export const CLUBS = [
  {
    name: "Cricket Club",
    handle: "@nit.cricket",
    avatar:
      "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=120&h=120&fit=crop&auto=format",
  },
  {
    name: "Coding Club",
    handle: "@devdomain",
    avatar:
      "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=120&h=120&fit=crop&auto=format",
  },
  {
    name: "Music Society",
    handle: "@nit.music",
    avatar:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&h=120&fit=crop&auto=format",
  },
  {
    name: "Photography Club",
    handle: "@nit.lens",
    avatar:
      "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=120&h=120&fit=crop&auto=format",
  },
]

export const INITIAL_NEWSLETTERS = [
  {
    id: "n1",
    club: "Cricket Club",
    description:
      "Open trials for the winter squad begin next week. Fresh kit, revised training slots and a new bowling machine arrive this season. Members get priority booking and a discounted merchandise bundle. Slots are limited, so reserve early through the members portal.",
    price: 299,
    image:
      "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=650&h=950&fit=crop&auto=format",
    date: "2026-08-24",
  },
  {
    id: "n2",
    club: "Coding Club",
    description:
      "A twelve-hour build sprint with mentors from the alumni network. Form a team, ship a working prototype and demo it live. Snacks, stickers and cloud credits included for every registered participant. Winning teams take home a hardware kit.",
    price: 149,
    image:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=650&h=950&fit=crop&auto=format",
    date: "2026-08-19",
  },
  {
    id: "n3",
    club: "Music Society",
    description:
      "Six intimate sessions across the semester featuring student performers and visiting artists. The season pass covers all evenings, front-row access and a curated playlist. Bring an instrument to the open-mic finale and share the stage.",
    price: 199,
    image:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=650&h=950&fit=crop&auto=format",
    date: "2026-08-11",
  },
]

/* ------------------------------------------------------------------ *
 * Store
 * ------------------------------------------------------------------ */

const NewslettersContext = createContext(null)

export function NewslettersProvider({ children }) {
  const [newsletters, setNewsletters] = useState(INITIAL_NEWSLETTERS)

  const save = (data, id) => {
    if (id) {
      setNewsletters((prev) => prev.map((n) => (n.id === id ? { ...n, ...data } : n)))
    } else {
      const created = {
        ...data,
        id: crypto.randomUUID(),
        date: new Date().toISOString().slice(0, 10),
      }
      setNewsletters((prev) => [created, ...prev])
    }
  }

  const remove = (id) =>
    setNewsletters((prev) => prev.filter((n) => n.id !== id))

  const get = (id) => newsletters.find((n) => n.id === id)

  return (
    <NewslettersContext.Provider value={{ newsletters, save, remove, get }}>
      {children}
    </NewslettersContext.Provider>
  )
}

export function useNewsletters() {
  const ctx = useContext(NewslettersContext)
  if (!ctx) throw new Error("useNewsletters must be used within NewslettersProvider")
  return ctx
}

/* ------------------------------------------------------------------ *
 * Icons
 * ------------------------------------------------------------------ */

const iconBase = (className = "size-5", strokeWidth = 1.75) => ({
  className,
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
})

export const PlusIcon = ({ className, strokeWidth }) => (
  <svg {...iconBase(className, strokeWidth)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const EditIcon = ({ className, strokeWidth }) => (
  <svg {...iconBase(className, strokeWidth)}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
)

export const TrashIcon = ({ className, strokeWidth }) => (
  <svg {...iconBase(className, strokeWidth)}>
    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
)

export const MailIcon = ({ className, strokeWidth }) => (
  <svg {...iconBase(className, strokeWidth)}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </svg>
)

export const ImageIcon = ({ className, strokeWidth }) => (
  <svg {...iconBase(className, strokeWidth)}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-4.5-4.5L5 21" />
  </svg>
)

export const SendIcon = ({ className, strokeWidth }) => (
  <svg {...iconBase(className, strokeWidth)}>
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
)

/* ------------------------------------------------------------------ *
 * Modal
 * ------------------------------------------------------------------ */

export function Modal({
  open,
  onClose,
  children,
  className = "",
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/40 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className={`animate-modal-in w-full rounded-3xl bg-[#ffffff] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.35)] ${className}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Confirm dialog (delete)
 * ------------------------------------------------------------------ */

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
  preview,
}) {
  return (
    <Modal open={open} onClose={onClose} className="max-w-sm">
      <div className="flex flex-col items-center px-7 pt-8 pb-7 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-[#171717] text-[#ffffff]">
          <TrashIcon className="size-5" />
        </div>
        <h3 className="mt-5 text-lg font-semibold tracking-tight text-[#171717]">{title}</h3>
        <p className="mt-1.5 max-w-[16rem] text-sm leading-relaxed text-[#737373]">{description}</p>

        {preview && <div className="mt-4 w-full">{preview}</div>}

        <div className="mt-6 flex w-full flex-col gap-2.5">
          <button
            onClick={onConfirm}
            className="w-full rounded-full border border-[#d4d4d4] bg-[#ffffff] py-3 text-sm font-medium text-[#171717] transition-colors hover:bg-[#fafafa]"
          >
            {confirmLabel}
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-full bg-[#f5f5f5] py-3 text-sm font-medium text-[#525252] transition-colors hover:bg-[#e5e5e5]"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ *
 * List page
 * ------------------------------------------------------------------ */

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function NewslettersContent() {
  const { newsletters, remove } = useNewsletters();
  const router = useRouter();
  const [toDelete, setToDelete] = useState(null);

  const confirmDelete = () => {
    if (!toDelete) return
    remove(toDelete.id)
    setToDelete(null)
  }

  return (
    <div>
      <div className="mx-auto sm:px-3.5 pb-5">
        {newsletters.length === 0 ? (
          <EmptyState onCreate={() => router.push("/dashboard/newsletter/editor")} />
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            {newsletters.map((n) => (
              <article
                key={n.id}
                className="group relative flex gap-4 overflow-hidden rounded-3xl border border-[#e5e5e5]/70 bg-[#ffffff] p-3 transition-all hover:border-neutral-300 hover:shadow-sm sm:gap-5 sm:p-4"
              >
                <button
                  onClick={() => router.push(`/dashboard/newsletter/editor?id=${n.id}`)}
                  className="relative w-24 shrink-0 overflow-hidden rounded-2xl bg-[#f5f5f5] sm:w-32"
                  style={{ aspectRatio: "325 / 475" }}
                >
                  <img
                    src={n.image}
                    alt={n.club}
                    className="h-full w-full object-cover"
                  />
                </button>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold tracking-tight text-[#171717]">
                      {n.club}
                    </span>
                    <span className="size-1 shrink-0 rounded-full bg-[#d4d4d4]" />
                    <span className="shrink-0 text-xs text-[#a3a3a3]">{formatDate(n.date)}</span>
                  </div>

                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#525252] sm:line-clamp-4">
                    {n.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-3">
                    <span className="text-base font-bold tabular-nums text-[#171717]">
                      {n.price === 0 ? "Free" : `₹${n.price.toLocaleString("en-IN")}`}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => router.push(`/dashboard/newsletter/editor?id=${n.id}`)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] px-3.5 py-1.5 text-xs font-semibold text-[#404040] transition-colors hover:border-[#171717] hover:bg-[#171717] hover:text-[#ffffff]"
                      >
                        <EditIcon className="size-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => setToDelete(n)}
                        className="flex size-8 items-center justify-center rounded-full border border-[#e5e5e5] text-[#a3a3a3] transition-colors hover:border-[#fecaca] hover:bg-[#fef2f2] hover:text-[#dc2626]"
                        aria-label="Delete newsletter"
                      >
                        <TrashIcon className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete newsletter?"
        description="This newsletter will be permanently removed from the campus feed. This action can't be undone."
        confirmLabel="Delete newsletter"
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
        preview={
          toDelete ? (
            <div className="flex items-center gap-3 rounded-2xl border border-[#f5f5f5] bg-[#fafafa] p-3 text-left">
              <img src={toDelete.image} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#171717]">{toDelete.club}</p>
                <p className="line-clamp-1 text-xs text-[#737373]">{toDelete.description}</p>
              </div>
            </div>
          ) : undefined
        }
      />
    </div>
  )
}

function EmptyState({ onCreate }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-3xl border border-[#e5e5e5]/80 py-20 text-center shadow-[0_2px_20px_-12px_rgba(0,0,0,0.12)]">
      <div className="flex size-14 items-center justify-center rounded-full bg-[#f5f5f5] text-[#a3a3a3]">
        <MailIcon className="size-6" strokeWidth={1.5} />
      </div>
      <h3 className="mt-4 text-base font-bold text-[#171717]">No newsletters yet</h3>
      <p className="mt-1 max-w-xs text-sm text-[#a3a3a3]">
        Publish your first newsletter to share updates with your campus.
      </p>
      <button
        onClick={onCreate}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#171717] px-5 py-2.5 text-sm font-semibold text-[#ffffff] transition-colors hover:bg-[#262626]"
      >
        <PlusIcon className="size-4" /> Publish newsletter
      </button>
    </div>
  )
}

export default function Page() {
  const router = useRouter();
  return (

    <DashboardEventsShell>
      <header
        className="sticky top-0 z-50 flex h-[54px] mb-5 w-full items-center justify-between border-b border-black/[0.06] bg-white/80 px-4 backdrop-blur-xl"
        style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
      >
        {/* Left */}
        <div
          className="flex items-center"
          style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
        >
          <button
            onClick={() => router.back()}
            className="mr-6 flex h-9 w-9 items-center cursor-pointer justify-center rounded-full transition hover:bg-black/5"
          >
            <ArrowLeft size={20} strokeWidth={2.2} />
          </button>

          <div>
            <h1 className="truncate text-[20px] font-bold leading-5 text-black">
              Newsletters
            </h1>

            <p className="mt-0.5 text-[13px] leading-4 text-[#536471]">
              Create and manage your newsletters
            </p>
          </div>
        </div>
        <div className='flex items-center gap-1.5'>
          <button
            onClick={() => router.push('./newsletter/editor')}
            aria-label="Find members looking for a team"
            className="inline-flex items-center gap-2 rounded-full border cursor-pointer border-[#e0e0de] bg-[#ffffff] py-2 pl-3 pr-3.5 text-[13px] font-semibold transition-colors hover:bg-[#f4f4f3]"
          >
            <Icon
              icon="solar:add-linear"
              className="text-[18px]"
            />
            <span className="hidden sm:inline">Publish New</span>
          </button>
        </div>
      </header>

      <NewslettersProvider>
        <NewslettersContent />
      </NewslettersProvider>
    </DashboardEventsShell>

  )
}
