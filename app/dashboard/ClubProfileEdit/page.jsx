"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  Suspense,
  useState,
} from "react";
import {
  ArrowLeft,
  Camera,
  Pencil,
  X,
  Check,
  Plus,
  Search,
  Move,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Loader2,
} from "lucide-react";
import { Icon } from "@iconify/react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardEventsShell } from "@/components/DashboardEventsShell";
import "@/app/dashboard/dashboard.css";

/* -------------------------------------------------------------------------- */
/*  Shared styles                                                              */
/* -------------------------------------------------------------------------- */

// Matches the EditProfile `.input` styling so the two pages look identical
// without depending on any external CSS.
const INPUT =
  "w-full rounded-xl border border-[#ececec] bg-white px-[14.4px] py-[11.2] text-[15px] leading-6 text-[#171717] outline-none transition placeholder:text-[#b3b7bd] focus:border-[#171717] focus:ring-4 focus:ring-[#171717]/[0.06]";

/* -------------------------------------------------------------------------- */
/*  Media validation                                                           */
/* -------------------------------------------------------------------------- */

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/* -------------------------------------------------------------------------- */
/*  Small building blocks                                                      */
/* -------------------------------------------------------------------------- */

function SectionHeader({ index, title, desc }) {
  return (
    <div className="mb-5">
      <div className="flex items-baseline gap-2.5">
        <span className="font-mono text-[11px] font-medium tracking-[0.18em] text-[#8a8f98]">
          {index}
        </span>
        <h2 className="font-display text-lg font-semibold leading-none text-[#171717]">
          {title}
        </h2>
      </div>
      <p className="mt-1.5 text-sm text-[#8a8f98]">{desc}</p>
    </div>
  );
}

function Card({ children }) {
  return (
    <section className="rounded-[20px] border border-[#ececec] bg-white p-5 sm:p-6">
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-[#8a8f98]">
        {label}
      </span>
      {children}
    </label>
  );
}

// Textarea that grows to fit its content so all the written text stays visible.
function AutoTextarea({ value, minRows = 3, className = "", ...rest }) {
  const ref = useRef(null);
  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };
  useLayoutEffect(resize, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      rows={minRows}
      onInput={resize}
      className={`resize-none overflow-hidden ${className}`}
      {...rest}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Crop modal (self-contained, no upload API)                                 */
/* -------------------------------------------------------------------------- */

const MAX_ZOOM = 4;

function CropModal({ src, aspect, title, round, onCancel, onApply }) {
  const frameRef = useRef(null);
  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const [nat, setNat] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef(null);

  const baseScale =
    nat.w && nat.h && frame.w && frame.h
      ? Math.max(frame.w / nat.w, frame.h / nat.h)
      : 1;

  const dispW = nat.w * baseScale * zoom;
  const dispH = nat.h * baseScale * zoom;

  const clamp = (o, currentZoom = zoom) => {
    if (!nat.w || !nat.h || !frame.w || !frame.h) return { x: 0, y: 0 };
    const curScale = baseScale * currentZoom;
    const maxX = Math.max(0, (nat.w * curScale - frame.w) / 2);
    const maxY = Math.max(0, (nat.h * curScale - frame.h) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, o.x)),
      y: Math.min(maxY, Math.max(-maxY, o.y)),
    };
  };

  useLayoutEffect(() => {
    const measure = () => {
      if (frameRef.current) {
        const r = frameRef.current.getBoundingClientRect();
        setFrame({ w: r.width, h: r.height });
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const img = new Image();
    if (src && src.startsWith("http")) img.crossOrigin = "anonymous";
    img.onload = () => setNat({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src]);

  useEffect(() => {
    setOffset((o) => clamp(o));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, frame.w, frame.h, nat.w, nat.h]);

  useEffect(() => {
    const stop = () => (drag.current = null);
    window.addEventListener("pointerup", stop);
    return () => window.removeEventListener("pointerup", stop);
  }, []);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(1, z - e.deltaY * 0.0015)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onMove = (e) => {
    if (!drag.current) return;
    setOffset(
      clamp({
        x: drag.current.ox + (e.clientX - drag.current.x),
        y: drag.current.oy + (e.clientY - drag.current.y),
      })
    );
  };

  const onStartDrag = (e) => {
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const apply = () => {
    if (!nat.w || !nat.h || !frame.w || !frame.h) return onApply(src);
    const outWidth = round ? 800 : 1500;
    const outHeight = Math.round(outWidth / aspect);
    const canvas = document.createElement("canvas");
    canvas.width = outWidth;
    canvas.height = outHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return onApply(src);

    const img = new Image();
    if (src && src.startsWith("http")) img.crossOrigin = "anonymous";
    img.onload = () => {
      const scale = baseScale * zoom;
      const srcW = frame.w / scale;
      const srcH = frame.h / scale;
      const srcX = (nat.w - srcW) / 2 - offset.x / scale;
      const srcY = (nat.h - srcH) / 2 - offset.y / scale;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outWidth, outHeight);
      try {
        ctx.drawImage(
          img,
          Math.max(0, Math.min(nat.w - srcW, srcX)),
          Math.max(0, Math.min(nat.h - srcH, srcY)),
          srcW,
          srcH,
          0,
          0,
          outWidth,
          outHeight
        );
        onApply(canvas.toDataURL("image/jpeg", 0.86));
      } catch {
        // Cross-origin images taint the canvas — fall back to the raw source.
        onApply(src);
      }
    };
    img.onerror = () => onApply(src);
    img.src = src;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#171717]/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        className={`relative max-h-[92vh] w-full overflow-y-auto rounded-[20px] border border-[#ececec] bg-white p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)] ${round ? "max-w-[420px]" : "max-w-xl"
          }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8a8f98]">
              Crop &amp; Adjust
            </p>
            <h3 className="font-display text-lg font-semibold">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="grid size-9 place-items-center rounded-full border border-[#ececec] text-[#8a8f98] transition hover:bg-neutral-100 hover:text-[#171717]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div
          ref={frameRef}
          onPointerMove={onMove}
          onPointerDown={onStartDrag}
          className="relative mx-auto w-full cursor-grab touch-none select-none overflow-hidden rounded-2xl border border-[#ececec] bg-neutral-900 active:cursor-grabbing"
          style={{ aspectRatio: String(aspect) }}
        >
          {nat.w > 0 && dispW > 0 && (
            <img
              src={src}
              alt="crop preview"
              draggable={false}
              className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none object-fill"
              style={{
                width: `${dispW}px`,
                height: `${dispH}px`,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
            />
          )}
          <div
            className={`pointer-events-none absolute inset-0 shadow-[0_0_0_2000px_rgba(0,0,0,0.45)] ${round ? "rounded-full" : ""
              }`}
          />
          <div
            className={`pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 overflow-hidden ${round ? "rounded-full" : ""
              }`}
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-white/30" />
            ))}
          </div>
          <div className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#171717]/70 px-3 py-1 text-[11px] font-medium text-white backdrop-blur whitespace-nowrap">
            <Move className="size-3" /> Drag to position · Scroll to zoom
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
            className="grid size-8 shrink-0 place-items-center rounded-full border border-[#ececec] text-[#8a8f98] transition hover:bg-neutral-100 hover:text-[#171717]"
          >
            <ZoomOut className="size-4" />
          </button>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-[#ececec] accent-[#171717]"
          />
          <button
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.25))}
            className="grid size-8 shrink-0 place-items-center rounded-full border border-[#ececec] text-[#8a8f98] transition hover:bg-neutral-100 hover:text-[#171717]"
          >
            <ZoomIn className="size-4" />
          </button>
          <button
            onClick={reset}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#ececec] px-3 py-1.5 text-xs font-medium text-[#8a8f98] transition hover:bg-neutral-100 hover:text-[#171717]"
          >
            <RotateCcw className="size-3.5" /> Reset
          </button>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-full border border-[#ececec] px-5 py-2.5 text-sm font-medium transition hover:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            onClick={apply}
            className="flex items-center gap-2 rounded-full bg-[#171717] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            <Check className="size-4" /> Apply
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Leadership member search (dropdown on query)                               */
/* -------------------------------------------------------------------------- */

function MemberSearch({ directory, chosenIds, onAdd }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return directory.filter(
      (u) =>
        !chosenIds.has(u.id) &&
        (u.name.toLowerCase().includes(q) ||
          u.handle.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [query, chosenIds, directory]);

  return (
    <div ref={ref} className="relative">
      <div className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-[#8a8f98]">
        <Search className="size-4" />
      </div>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search members by name or username…"
        className={INPUT}
        style={{ paddingLeft: "2.75rem" }}
      />

      {open && query.trim() && (
        <div className="absolute z-40 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-[#ececec] bg-white p-1.5 shadow-[0_20px_50px_-16px_rgba(0,0,0,0.25)]">
          {results.length > 0 ? (
            results.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  onAdd(u);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-neutral-100"
              >
                {u.img ? (
                  <img
                    src={u.img}
                    alt={u.name}
                    className="size-9 shrink-0 rounded-full border border-black/10 bg-neutral-100 object-cover"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="size-9 shrink-0 rounded-full border border-black/10 bg-neutral-100"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-[#171717]">
                    {u.name}
                  </span>
                  <span className="block truncate text-xs text-[#8a8f98]">
                    @{u.handle}
                  </span>
                </span>
                <Plus className="size-4 shrink-0 text-[#8a8f98]" />
              </button>
            ))
          ) : (
            <p className="px-3 py-4 text-center text-sm text-[#8a8f98]">
              No members found for &ldquo;{query.trim()}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

function EditClubProfile() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clubId = searchParams.get("clubId");
  const [banner, setBanner] = useState("");
  const [avatar, setAvatar] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [about, setAbout] = useState("");
  const [whatWeDo, setWhatWeDo] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [crop, setCrop] = useState(null);
  const bannerInput = useRef(null);
  const avatarInput = useRef(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!clubId) {
      setError("A club could not be identified.");
      return;
    }

    let cancelled = false;
    const loadClub = async () => {
      try {
        const response = await fetch(`/api/clubs/${clubId}`, { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result?.message || "Unable to load club profile.");
        if (cancelled) return;

        const club = result.club;
        const availableMembers = [...(club.members || []), ...(club.leaders || [])]
          .reduce((items, person) => {
            const email = typeof person?.email === "string" ? person.email.toLowerCase() : "";
            if (email && !items.some((item) => item.email === email)) {
              items.push({
                id: person.userId || email,
                email,
                name: person.name || email,
                handle: email.split("@")[0],
                img: person.profilePicture || person.image || "",
              });
            }
            return items;
          }, []);

        setBanner(club.banner || "");
        setAvatar(club.logo || "");
        setName(club.clubName || "");
        setCategory(club.category || "");
        setAbout(club.description || "");
        setWhatWeDo((club.activities || [])
          .filter((activity) => !activity.date && !activity.formId)
          .map((activity) => ({ title: activity.title || "", desc: activity.description || "" })));
        const uniqueLeaders = new Map();
        (club.leaders || []).forEach((leader) => {
          const email = typeof leader?.email === "string" ? leader.email.toLowerCase() : "";
          if (!email || uniqueLeaders.has(email)) return;
          uniqueLeaders.set(email, {
            id: leader.userId || email,
            email,
            name: leader.name || email,
            handle: email.split("@")[0],
            img: leader.image || "",
            role: leader.position || "",
          });
        });
        setLeaders([...uniqueLeaders.values()]);
        setDirectory(availableMembers);
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || "Unable to load club profile.");
      }
    };
    loadClub();
    return () => { cancelled = true; };
  }, [clubId]);

  const chosenIds = useMemo(() => new Set(leaders.map((leader) => leader.id)), [leaders]);

  const pick = (kind) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setError("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("Image must be 10 MB or smaller.");
      return;
    }
    setError("");
    setCrop({ kind, src: URL.createObjectURL(file) });
  };

  const handleCropApply = (url) => {
    const kind = crop?.kind;
    setCrop(null);
    if (kind === "banner") setBanner(url);
    else setAvatar(url);
  };

  const updateWhatWeDo = (i, key, value) =>
    setWhatWeDo((p) => p.map((it, idx) => (idx === i ? { ...it, [key]: value } : it)));

  const setLeaderRole = (id, role) =>
    setLeaders((p) => p.map((l) => (l.id === id ? { ...l, role } : l)));

  const handleSave = async () => {
    if (saving) return;
    if (!clubId) {
      setError("A club could not be identified.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/clubs/${clubId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banner,
          logo: avatar,
          clubName: name,
          category,
          description: about,
          activities: whatWeDo.map((item) => ({ title: item.title, description: item.desc })),
          leaders: leaders.map((leader) => ({ email: leader.email, position: leader.role })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || "Unable to save club profile.");
      setBanner(result.club.banner || "");
      setAvatar(result.club.logo || "");
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch (saveError) {
      setError(saveError.message || "Unable to save club profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardEventsShell>
      <div className="min-h-full bg-white text-[#171717]">
        {/* Sticky header */}
        <header
          className="sticky top-0 z-50 flex h-[54px] w-full items-center justify-between border-b border-black/[0.06] bg-white/80 px-4 backdrop-blur-xl"
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
                Edit Club Profile
              </h1>

              <p className="mt-0.5 text-[13px] leading-4 text-[#536471]">
                Update profile
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5">
            <div className="group relative">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex h-9 gap-1 px-4 items-center cursor-pointer justify-center rounded-full transition hover:bg-black/5"
              >
                <Icon
                  icon="solar:pen-outline"
                  className="text-[21px] text-[#171717]"
                />Save
              </button>

              <div className="pointer-events-none absolute right-1/2 top-full mt-2 translate-x-1/2 rounded-full bg-[#2c2f35] px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 transition-all duration-200 group-hover:translate-y-1 group-hover:opacity-100">
                Save Profile
              </div>
            </div>
          </div>
        </header>

        <div className="px-3.5 sm:px-[14px]">
          <div className="mx-auto w-full max-w-3xl">
            <div className="space-y-3 pt-5 pb-10">
              {/* Media --------------------------------------------------- */}
              <section className="overflow-hidden rounded-[24px] border border-[#ececec] bg-white">
                <div className="relative">
                  {/* Banner */}
                  <div className="group relative h-[160px] w-full overflow-hidden bg-neutral-100 sm:h-[200px]">
                    {banner ? <img src={banner} alt="Club banner" className="size-full object-cover" /> : null}

                    {/* Banner shadow */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

                    {/* Banner controls */}
                    <div className="absolute inset-0 flex items-center justify-center gap-3 bg-[#171717]/25 opacity-0 transition group-hover:opacity-100 max-sm:opacity-100">
                      <button
                        onClick={() => bannerInput.current?.click()}
                        title="Upload banner"
                        className="grid size-11 place-items-center rounded-full bg-[#171717]/70 text-white backdrop-blur transition hover:bg-[#171717]"
                      >
                        <Camera className="size-[18px]" />
                      </button>
                      <button
                        onClick={() => banner && setCrop({ kind: "banner", src: banner })}
                        title="Adjust banner"
                        disabled={!banner}
                        className="grid size-11 place-items-center rounded-full bg-[#171717]/70 text-white backdrop-blur transition hover:bg-[#171717]"
                      >
                        <Pencil className="size-[18px]" />
                      </button>
                    </div>
                  </div>

                  {/* Profile picture area */}
                  <div className="relative px-5 pb-5 sm:px-7 sm:pb-7">
                    <div className="flex items-end gap-4">
                      <div className="group relative -mt-10 sm:-mt-13">
                        <div className="w-fit rounded-full bg-white p-0.75">
                          <div className="relative h-[75px] w-[75px] sm:h-[100px] sm:w-[100px]">
                            {/* Avatar */}
                            <div className="absolute inset-0 overflow-hidden rounded-full bg-neutral-100">
                              {avatar ? <img src={avatar} alt="Club avatar" className="size-full object-cover" /> : null}
                            </div>

                            {/* Camera overlay */}
                            <button
                              onClick={() => avatarInput.current?.click()}
                              title="Change photo"
                              className="absolute inset-0 z-10 grid place-items-center overflow-hidden rounded-full bg-[#171717]/40 text-white opacity-0 transition group-hover:opacity-100 max-sm:opacity-100"
                            >
                              <Camera className="size-6" />
                            </button>

                            {/* Inner border */}
                            <div className="pointer-events-none absolute inset-0 z-20 rounded-full border border-black/10" />
                          </div>
                        </div>

                        {/* Adjust photo button */}
                        <button
                          onClick={() => avatar && setCrop({ kind: "avatar", src: avatar })}
                          title="Adjust photo"
                          disabled={!avatar}
                          className="absolute bottom-0 right-0 z-30 grid size-8 place-items-center rounded-full border-2 border-white bg-[#171717] text-white transition hover:opacity-90"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      </div>

                      <p className="pb-2 text-sm text-[#8a8f98]">
                        Hover a photo to upload or adjust.
                      </p>
                    </div>
                  </div>
                </div>

                <input ref={bannerInput} type="file" accept="image/*" hidden onChange={pick("banner")} />
                <input ref={avatarInput} type="file" accept="image/*" hidden onChange={pick("avatar")} />
              </section>

              {/* Basic details ------------------------------------------ */}
              <Card>
                <SectionHeader
                  index="01"
                  title="Basic details"
                  desc="The name and category members see first."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Club name">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={INPUT}
                      placeholder="Your club name"
                    />
                  </Field>
                  <Field label="Category">
                    <input
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={INPUT}
                      placeholder="e.g. Innovation"
                    />
                  </Field>
                </div>
              </Card>

              {/* About --------------------------------------------------- */}
              <Card>
                <SectionHeader
                  index="02"
                  title="About"
                  desc="Tell people what your club is all about."
                />
                <div className="relative">
                  <AutoTextarea
                    value={about}
                    minRows={4}
                    onChange={(e) => setAbout(e.target.value.slice(0, 600))}
                    className={`${INPUT} leading-relaxed`}
                    placeholder="Describe your club, its mission and what makes it special…"
                  />
                  <span className="mt-1.5 block text-right font-mono text-[11px] text-[#8a8f98]">
                    {about.length}/600
                  </span>
                </div>
              </Card>

              {/* What we do ---------------------------------------------- */}
              <Card>
                <SectionHeader
                  index="03"
                  title="What we do"
                  desc="Four highlights that capture your club at a glance."
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  {whatWeDo.map((item, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-[#ececec] p-4 transition focus-within:border-[#171717] focus-within:ring-4 focus-within:ring-[#171717]/[0.06]"
                    >
                      <input
                        value={item.title}
                        onChange={(e) => updateWhatWeDo(i, "title", e.target.value)}
                        placeholder="Point title"
                        className="mb-2 w-full bg-transparent text-sm font-semibold text-[#171717] outline-none placeholder:font-normal placeholder:text-[#8a8f98]"
                      />
                      <AutoTextarea
                        value={item.desc}
                        minRows={2}
                        onChange={(e) => updateWhatWeDo(i, "desc", e.target.value.slice(0, 150))}
                        placeholder="Describe this highlight…"
                        className="w-full bg-transparent text-sm leading-relaxed text-neutral-600 outline-none placeholder:text-[#8a8f98]"
                      />
                      <span className="mt-1.5 block text-right font-mono text-[10px] text-[#8a8f98]">
                        {item.desc.length}/150
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Leadership team ---------------------------------------- */}
              <Card>
                <SectionHeader
                  index="04"
                  title="Leadership team"
                  desc="Search members and assign their leadership roles."
                />

                <MemberSearch
                  directory={directory}
                  chosenIds={chosenIds}
                  onAdd={(u) => setLeaders((p) => [...p, { ...u, role: "Member" }])}
                />

                <div className="mt-4 space-y-2.5">
                  {leaders.length === 0 && (
                    <p className="rounded-xl border border-dashed border-[#ececec] px-4 py-6 text-center text-sm text-[#8a8f98]">
                      No leaders yet. Search above to add your first one.
                    </p>
                  )}

                  {leaders.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center gap-3 rounded-xl border border-[#ececec] px-3 py-2.5"
                    >
                      {l.img ? (
                        <img
                          src={l.img}
                          alt={l.name}
                          className="size-11 shrink-0 rounded-full border border-black/10 bg-neutral-100 object-cover"
                        />
                      ) : (
                        <div
                          aria-hidden="true"
                          className="size-11 shrink-0 rounded-full border border-black/10 bg-neutral-100"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#171717]">{l.name}</p>
                        <p className="truncate text-xs text-[#8a8f98]">@{l.handle}</p>
                      </div>
                      <input
                        value={l.role}
                        onChange={(e) => setLeaderRole(l.id, e.target.value)}
                        placeholder="Role"
                        className="w-32 shrink-0 rounded-lg border border-[#ececec] bg-white px-3 py-2 text-sm text-[#171717] outline-none transition focus:border-[#171717] focus:ring-4 focus:ring-[#171717]/[0.06] sm:w-40"
                      />
                      <button
                        onClick={() => setLeaders((p) => p.filter((x) => x.id !== l.id))}
                        aria-label={`Remove ${l.name}`}
                        className="grid size-8 shrink-0 place-items-center rounded-full text-[#8a8f98] transition hover:bg-[#171717] hover:text-white"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>

              {error && <p className="px-1 text-sm font-medium text-red-600">{error}</p>}

              {/* Action bar --------------------------------------------- */}
              <div className="flex gap-3">
                <button
                  onClick={() => window.history.back()}
                  className="flex-1 rounded-full border border-[#ececec] bg-white px-5 py-3 text-sm font-medium transition hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#171717] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : saved ? (
                    <Check className="size-4" />
                  ) : null}
                  {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {crop && (
          <CropModal
            src={crop.src}
            aspect={crop.kind === "banner" ? 3 : 1}
            round={crop.kind === "avatar"}
            title={crop.kind === "banner" ? "Banner image" : "Profile picture"}
            onCancel={() => setCrop(null)}
            onApply={handleCropApply}
          />
        )}
      </div>
    </DashboardEventsShell>
  );
}

export default function EditClubProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <EditClubProfile />
    </Suspense>
  );
}
