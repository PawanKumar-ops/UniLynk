"use client"

import { useEffect, useLayoutEffect, useRef, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardEventsShell } from "@/components/DashboardEventsShell"
import "@/app/dashboard/dashboard.css"
import "@/components/events-pages.css"
import {
  ImageIcon,
  Modal,
} from "../page"
import { ArrowLeft } from "lucide-react"

const WORD_LIMIT = 120
const ASPECT = 325 / 475

function countWords(text) {
  const t = text.trim()
  return t ? t.split(/\s+/).length : 0
}

/* ------------------------------------------------------------------ *
 * Crop helper
 * ------------------------------------------------------------------ */

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (err) => reject(err))
    image.setAttribute("crossOrigin", "anonymous")
    image.src = url
  })
}

async function getCroppedImg(imageSrc, cropArea) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) return imageSrc

  canvas.width = cropArea.width
  canvas.height = cropArea.height
  ctx.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height,
  )
  return canvas.toDataURL("image/jpeg", 0.92)
}

/* ------------------------------------------------------------------ *
 * Image cropper modal
 * ------------------------------------------------------------------ */

function ImageCropperModal({
  open,
  imageSrc,
  onCancel,
  onCropped,
}) {
  const frameRef = useRef(null)
  const [natural, setNatural] = useState({ w: 0, h: 0 })
  const [frame, setFrame] = useState({ w: 0, h: 0 })
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [saving, setSaving] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const drag = useRef(null)

  useEffect(() => {
    if (!open || !imageSrc) return
    const img = new Image()
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = imageSrc
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }, [open, imageSrc])

  useLayoutEffect(() => {
    if (!open) return
    const el = frameRef.current
    if (!el) return
    const measure = () => setFrame({ w: el.clientWidth, h: el.clientHeight })
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [open])

  const baseScale = natural.w && frame.w ? Math.max(frame.w / natural.w, frame.h / natural.h) : 1
  const scale = baseScale * zoom
  const renderedW = natural.w * scale
  const renderedH = natural.h * scale

  const clamp = (o) => ({
    x: Math.min(0, Math.max(frame.w - renderedW, o.x)),
    y: Math.min(0, Math.max(frame.h - renderedH, o.y)),
  })

  useEffect(() => {
    setOffset((o) => clamp(o))
  }, [zoom, frame.w, frame.h, natural.w, natural.h])

  const onPointerDown = (e) => {
    e.target.setPointerCapture(e.pointerId)
    drag.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y }
    setIsDragging(true)
  }
  const onPointerMove = (e) => {
    if (!drag.current) return
    setOffset(
      clamp({
        x: drag.current.ox + (e.clientX - drag.current.px),
        y: drag.current.oy + (e.clientY - drag.current.py),
      }),
    )
  }
  const onPointerUp = () => {
    drag.current = null
    setIsDragging(false)
  }

  const handleSave = async () => {
    if (!scale) return
    setSaving(true)
    const result = await getCroppedImg(imageSrc, {
      x: -offset.x / scale,
      y: -offset.y / scale,
      width: frame.w / scale,
      height: frame.h / scale,
    })
    setSaving(false)
    onCropped(result)
  }

  return (
    <Modal open={open} onClose={onCancel} className="max-w-lg overflow-hidden">
      <div className="px-6 pt-6 pb-4">
        <h3 className="text-lg font-bold tracking-tight text-[#171717]">Crop image</h3>
        <p className="mt-1 text-sm text-[#737373]">
          Drag to reposition and use the slider to zoom. Ratio is fixed at 325:475.
        </p>
      </div>

      <div
        ref={frameRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative mx-auto w-60 overflow-hidden rounded-2xl bg-[#0a0a0a] select-none"
        style={{
          aspectRatio: String(ASPECT),
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none",
        }}
      >
        {imageSrc && renderedW > 0 && (
          <img
            src={imageSrc}
            alt="Crop preview"
            draggable={false}
            className="pointer-events-none absolute top-0 left-0 max-w-none"
            style={{
              width: renderedW,
              height: renderedH,
              transform: `translate(${offset.x}px, ${offset.y}px)`,
            }}
          />
        )}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border border-[#ffffff]/15" />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 px-6 pt-5">
        <span className="text-xs font-medium tracking-wide text-[#a3a3a3] uppercase">Zoom</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-[#e5e5e5] accent-[#171717]"
        />
      </div>

      <div className="flex gap-3 p-6">
        <button
          onClick={onCancel}
          className="flex-1 rounded-full bg-[#f5f5f5] py-3 text-sm font-semibold text-[#404040] transition-colors hover:bg-[#e5e5e5]"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !renderedW}
          className="flex-1 rounded-full bg-[#171717] py-3 text-sm font-semibold text-[#ffffff] transition-colors hover:bg-[#262626] disabled:opacity-50"
        >
          {saving ? "Cropping…" : "Apply crop"}
        </button>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ *
 * Club picker modal
 * ------------------------------------------------------------------ */

function ClubPickerModal({
  open,
  initial,
  isEdit,
  clubs = [],
  onClose,
  onConfirm,
}) {
  const [selected, setSelected] = useState(initial)

  useEffect(() => {
    if (open) setSelected(initial || (clubs[0] ? String(clubs[0]._id) : ""))
  }, [open, initial, clubs])

  return (
    <Modal open={open} onClose={onClose} className="max-w-sm overflow-hidden">
      <div className="px-6 pt-6 pb-2 text-center">
        <h3 className="text-lg font-bold tracking-tight text-[#171717]">
          {isEdit ? "Republish as" : "Publish as"}
        </h3>
        <p className="mt-1 text-sm text-[#737373]">
          Choose the club to post this newsletter on behalf of.
        </p>
      </div>

      <div className="max-h-72 space-y-1.5 overflow-y-auto px-4 py-4">
        {clubs.length === 0 ? (
          <p className="py-4 text-center text-xs text-[#a3a3a3]">
            No leadership clubs found. You must be a leader of a club to publish a newsletter.
          </p>
        ) : (
          clubs.map((c) => {
            const active = String(selected) === String(c._id) || selected === c.clubName
            return (
              <button
                key={c._id}
                onClick={() => setSelected(String(c._id))}
                className={`flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-all ${active ? "border-[#171717] bg-[#fafafa]" : "border-transparent hover:bg-[#fafafa]"
                  }`}
              >
                <img
                  src={c.logo || "/Defaultclublogo.svg"}
                  alt={c.clubName}
                  className="size-11 shrink-0 rounded-full object-cover ring-1 ring-[#e5e5e5]"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#171717]">{c.clubName}</p>
                  <p className="truncate text-xs text-[#a3a3a3]">
                    {c.category ? `@${c.category.toLowerCase()}` : "@club"}
                  </p>
                </div>
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${active ? "border-[#171717] bg-[#171717]" : "border-[#d4d4d4]"
                    }`}
                >
                  {active && (
                    <svg
                      viewBox="0 0 24 24"
                      className="size-3 text-[#ffffff]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </span>
              </button>
            )
          })
        )}
      </div>

      <div className="flex gap-3 border-t border-[#f5f5f5] p-4">
        <button
          onClick={onClose}
          className="flex-1 rounded-full bg-[#f5f5f5] py-3 text-sm font-semibold text-[#404040] transition-colors hover:bg-[#e5e5e5]"
        >
          Cancel
        </button>
        <button
          onClick={() => selected && onConfirm(selected)}
          disabled={!selected || clubs.length === 0}
          className="flex-1 rounded-full bg-[#171717] py-3 text-sm font-semibold text-[#ffffff] transition-colors hover:bg-[#262626] disabled:opacity-40"
        >
          {isEdit ? "Save changes" : "Publish"}
        </button>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ *
 * Editor page content
 * ------------------------------------------------------------------ */

function EditorContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const preselectedClubId = searchParams.get("clubId")
  const router = useRouter()

  const [existing, setExisting] = useState(null)
  const [userClubs, setUserClubs] = useState([])
  const [selectedClubId, setSelectedClubId] = useState(preselectedClubId || "")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [image, setImage] = useState("")

  const [rawImage, setRawImage] = useState(null)
  const [pickClub, setPickClub] = useState(false)
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const fileRef = useRef(null)

  const isEdit = Boolean(id || existing)

  useEffect(() => {
    let cancelled = false
    fetch("/api/clubs?leadershipOnly=true")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (Array.isArray(data?.clubs)) {
          setUserClubs(data.clubs)
          if (preselectedClubId) {
            const match = data.clubs.find((c) => String(c._id) === String(preselectedClubId))
            if (match) setSelectedClubId(String(match._id))
          } else if (data.clubs.length > 0 && !selectedClubId) {
            setSelectedClubId(String(data.clubs[0]._id))
          }
        }
      })
      .catch((err) => console.error("Error fetching leadership clubs:", err))
    return () => { cancelled = true }
  }, [preselectedClubId])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    fetch(`/api/newsletter?id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (data?.newsletter) {
          setExisting(data.newsletter)
          setDescription(data.newsletter.description || "")
          setPrice(String(data.newsletter.price ?? 0))
          setImage(data.newsletter.coverImage || data.newsletter.image || "")
          if (data.newsletter.clubId) {
            setSelectedClubId(String(data.newsletter.clubId))
          }
        }
      })
      .catch((err) => console.error("Error fetching newsletter:", err))
    return () => { cancelled = true }
  }, [id])

  const words = countWords(description)
  const overLimit = words > WORD_LIMIT
  const valid = image && description.trim() && !overLimit && price !== ""

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setRawImage(reader.result)
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const attemptPublish = () => {
    setTouched(true)
    setErrorMsg("")
    if (!valid) return
    setPickClub(true)
  }

  const publishWithClub = async (targetClubId) => {
    setPickClub(false)
    setSubmitting(true)
    setErrorMsg("")

    try {
      const method = isEdit ? "PUT" : "POST"
      const body = {
        id: id || existing?.id || existing?._id,
        clubId: targetClubId,
        description: description.trim(),
        price: Number(price || 0),
        coverImage: image,
      }

      const res = await fetch("/api/newsletter", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save newsletter")
      }

      router.push("/dashboard/newsletter")
    } catch (err) {
      setErrorMsg(err.message || "Failed to save newsletter")
    } finally {
      setSubmitting(false)
    }
  }

  const border = (invalid) => (touched && invalid ? "border-[#fca5a5]" : "border-[#e5e5e5]")

  return (
    <div>
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
      </header>

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />

      <div className="@container mx-auto max-w-3xl px-[14px] pb-20 pt-6 sm:pb-24 sm:pt-8">
        {errorMsg && (
          <div className="mb-5 rounded-2xl bg-red-50 p-4 border border-red-200 text-sm font-medium text-red-600">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 gap-7 @md:grid-cols-[270px_minmax(0,1fr)] @md:gap-8 @lg:grid-cols-[290px_minmax(0,1fr)]">
          <div className="@md:sticky @md:top-24 @md:self-start">
            {image ? (
              <div
                className="group relative mx-auto w-full max-w-[290px] overflow-hidden rounded-3xl bg-[#f5f5f5] ring-1 ring-[#e5e5e5] @md:max-w-none"
                style={{ aspectRatio: "325 / 475" }}
              >
                <img src={image} alt="Cover" className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-4 pt-12 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#171717] shadow-sm transition-transform hover:scale-105"
                  >
                    Replace
                  </button>

                  <button
                    onClick={() => setImage("")}
                    className="rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-[#dc2626] shadow-sm transition-transform hover:scale-105"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className={`group relative mx-auto flex w-full max-w-[290px] flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border-2 border-dashed bg-[#fafafa] text-center transition-colors hover:border-[#a3a3a3] hover:bg-[#f5f5f5]/70 @md:max-w-none ${touched && !image ? "border-[#fca5a5]" : "border-[#d4d4d4]"
                  }`}
                style={{ aspectRatio: "325 / 475" }}
              >
                <span className="flex size-14 items-center justify-center rounded-2xl bg-[#ffffff] text-[#a3a3a3] shadow-sm ring-1 ring-[#e5e5e5]/70 transition-transform group-hover:scale-105">
                  <ImageIcon className="size-7" strokeWidth={1.5} />
                </span>
                <span className="text-sm font-semibold text-[#171717]">Add a portrait cover</span>
                <span className="px-6 text-xs leading-relaxed text-[#a3a3a3]">
                  Click to upload — cropped to 325 : 475
                </span>
              </button>
            )}
          </div>

          <div className="space-y-6">
            <Section label="Description">
              <div className={`rounded-2xl border ${border(!description.trim() || overLimit)} bg-[#ffffff] p-4`}>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={7}
                  placeholder="What is this newsletter about? Keep it under 120 words."
                  className="w-full resize-none overflow-y-auto bg-transparent text-[14px] leading-6 text-[#171717] outline-none placeholder:text-[#b0b0b0] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                />
                <div className="mt-2 flex items-center justify-between border-t border-[#f5f5f5] pt-2.5">
                  <span className="text-xs text-[#a3a3a3]">Keep it short and clear.</span>
                  <span
                    className={`text-xs tabular-nums ${overLimit ? "text-[#ef4444]" : "text-[#a3a3a3]"}`}
                  >
                    {words} / {WORD_LIMIT} words
                  </span>
                </div>
              </div>
            </Section>

            <Section label="Price">
              <div
                className={`flex items-center justify-between gap-3 rounded-2xl border ${border(price === "")} bg-[#ffffff] px-4 py-3 transition-colors focus-within:border-[#171717]`}
              >
                <div className="flex flex-1 items-center gap-2">
                  <span className="text-lg font-semibold text-[#a3a3a3]">₹</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent text-lg font-semibold text-[#171717] outline-none placeholder:font-normal placeholder:text-[#d4d4d4] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
                <span className="shrink-0 rounded-full bg-[#f5f5f5] px-3 py-1.5 text-xs font-semibold text-[#737373]">
                  {price === "" || Number(price) === 0 ? "Free" : "INR"}
                </span>
              </div>
              <p className="mt-2 text-xs text-[#a3a3a3]">
                Amount members pay to access this newsletter. Set to 0 to make it free.
              </p>
            </Section>
          </div>
        </div>

        {/* Bottom publish action */}
        <div className="bottom-0 z-40 -mx-[14px] mt-6 px-[14px] pb-4 pt-12 sm:pb-5">
          <div
            className="pointer-events-none absolute inset-0"
          />

          <button
            onClick={attemptPublish}
            disabled={submitting}
            className="relative z-10 mx-auto flex h-12 w-full max-w-3xl items-center justify-center gap-2 rounded-full bg-[#171717] px-4 text-sm font-semibold text-white transition-all hover:bg-[#292929] active:scale-[0.99] disabled:opacity-50"
          >

            <span className="truncate">
              {submitting
                ? "Saving..."
                : isEdit
                ? "Save changes"
                : "Publish newsletter"}
            </span>
          </button>
        </div>
      </div>

      <ImageCropperModal
        open={Boolean(rawImage)}
        imageSrc={rawImage || ""}
        onCancel={() => setRawImage(null)}
        onCropped={(url) => {
          setImage(url)
          setRawImage(null)
        }}
      />

      <ClubPickerModal
        open={pickClub}
        initial={selectedClubId}
        isEdit={isEdit}
        clubs={userClubs}
        onClose={() => setPickClub(false)}
        onConfirm={publishWithClub}
      />
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div>
      <p className="mb-2.5 text-[11px] font-semibold tracking-[0.15em] text-[#a3a3a3] uppercase">
        {label}
      </p>
      {children}
    </div>
  )
}

export default function EditorPage() {
  return (
    <DashboardEventsShell>
      <Suspense fallback={<div className="p-8 text-center text-sm text-neutral-500">Loading editor...</div>}>
        <EditorContent />
      </Suspense>
    </DashboardEventsShell>
  )
}

