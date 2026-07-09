import * as React from "react";
import { Camera, Check, X } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function useIsMobile() {
    const [isMobile, setIsMobile] = React.useState(false);
    React.useEffect(() => {
        const mql = window.matchMedia("(max-width: 640px)");
        const onChange = () => setIsMobile(mql.matches);
        onChange();
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, []);
    return isMobile;
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

/* ------------------------------------------------------------------ */
/* Custom round image cropper (drag to pan, slider to zoom)            */
/* ------------------------------------------------------------------ */

function CropStep({ src, onCancel, onDone }) {
    const viewportRef = React.useRef(null);
    const dragRef = React.useRef(null);

    const [img, setImg] = React.useState(null);
    const [viewport, setViewport] = React.useState(0);
    const [zoom, setZoom] = React.useState(1);
    const [offset, setOffset] = React.useState({ x: 0, y: 0 });
    const [busy, setBusy] = React.useState(false);

    // Load the source image.
    React.useEffect(() => {
        let alive = true;
        loadImage(src).then((loaded) => {
            if (alive) setImg(loaded);
        });
        return () => {
            alive = false;
        };
    }, [src]);

    // Measure the square viewport.
    React.useEffect(() => {
        if (!viewportRef.current) return;
        const el = viewportRef.current;
        const measure = () => setViewport(el.clientWidth);
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Base "cover" scale so the image always fills the viewport.
    const baseScale =
        img && viewport
            ? Math.max(viewport / img.naturalWidth, viewport / img.naturalHeight)
            : 1;
    const dispW = img ? img.naturalWidth * baseScale * zoom : 0;
    const dispH = img ? img.naturalHeight * baseScale * zoom : 0;

    const clamp = React.useCallback(
        (next) => {
            const maxX = Math.max(0, (dispW - viewport) / 2);
            const maxY = Math.max(0, (dispH - viewport) / 2);
            return {
                x: Math.min(maxX, Math.max(-maxX, next.x)),
                y: Math.min(maxY, Math.max(-maxY, next.y)),
            };
        },
        [dispW, dispH, viewport],
    );

    // Re-clamp when zoom changes.
    React.useEffect(() => {
        setOffset((prev) => clamp(prev));
    }, [zoom, clamp]);

    const onPointerDown = (e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = { px: e.clientX, py: e.clientY, ...offset };
    };
    const onPointerMove = (e) => {
        if (!dragRef.current) return;
        const d = dragRef.current;
        setOffset(
            clamp({ x: d.x + (e.clientX - d.px), y: d.y + (e.clientY - d.py) }),
        );
    };
    const onPointerUp = () => {
        dragRef.current = null;
    };

    const apply = async () => {
        if (!img || !viewport) return;
        setBusy(true);
        try {
            const scale = baseScale * zoom;
            const left = viewport / 2 + offset.x - dispW / 2;
            const top = viewport / 2 + offset.y - dispH / 2;
            const sx = -left / scale;
            const sy = -top / scale;
            const sSize = viewport / scale;

            const out = Math.min(512, Math.round(sSize));
            const canvas = document.createElement("canvas");
            canvas.width = out;
            canvas.height = out;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, out, out);

            const url = await new Promise((resolve) =>
                canvas.toBlob((b) => resolve(URL.createObjectURL(b)), "image/png"),
            );
            onDone(url);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex h-full flex-col">
            <div className="flex min-h-0 flex-1 items-center justify-center">
                <div
                    ref={viewportRef}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    className="relative aspect-square h-full cursor-grab touch-none overflow-hidden rounded-[1rem] bg-neutral-100 active:cursor-grabbing"
                >
                    {img && (
                        <img
                            src={src}
                            alt="Crop preview"
                            draggable={false}
                            className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                            style={{
                                width: dispW,
                                height: dispH,
                                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                            }}
                        />
                    )}
                    {/* Round mask */}
                    <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgba(255,255,255,0.72)]" />
                    <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-black/10" />
                </div>
            </div>

            <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="mt-3 h-1 w-full cursor-pointer appearance-none rounded-full bg-neutral-200 accent-neutral-900"
            />

            <div className="mt-3 flex items-center gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex h-9 flex-1 items-center justify-center rounded-full border border-neutral-200 text-[13px] text-neutral-600 transition-colors hover:bg-neutral-100"
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={apply}
                    disabled={!img || busy}
                    className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-neutral-900 text-[13px] text-white transition-colors hover:bg-neutral-700 disabled:opacity-50"
                >
                    <Check className="size-3.5" strokeWidth={2.5} />
                    {busy ? "Saving" : "Apply"}
                </button>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Form step                                                           */
/* ------------------------------------------------------------------ */

function GroupForm({ onSubmit }) {
    const [name, setName] = React.useState("");
    const [image, setImage] = React.useState(null);
    const [rawImage, setRawImage] = React.useState(null);
    const fileInputRef = React.useRef(null);

    const handleFile = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setRawImage(URL.createObjectURL(file));
        event.target.value = "";
    };

    const trimmed = name.trim();
    const canSubmit = trimmed.length > 0;

    if (rawImage) {
        return (
            <CropStep
                src={rawImage}
                onCancel={() => {
                    URL.revokeObjectURL(rawImage);
                    setRawImage(null);
                }}
                onDone={(url) => {
                    if (image) URL.revokeObjectURL(image);
                    setImage(url);
                    URL.revokeObjectURL(rawImage);
                    setRawImage(null);
                }}
            />
        );
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (canSubmit) onSubmit({ name: trimmed, image });
            }}
            className="flex h-full flex-col items-center"
        >
            <p className="text-[14px] text-neutral-900">New group</p>

            {/* Avatar */}
            <div className="relative mt-3">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative flex size-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-neutral-100 to-neutral-200 ring-1 ring-inset ring-neutral-200 transition-transform hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                    aria-label="Upload group picture"
                >
                    {image ? (
                        <img src={image} alt="Group" className="size-full object-cover" />
                    ) : (
                        <Camera className="size-5 text-neutral-400" strokeWidth={1.75} />
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Camera className="size-4 text-white" strokeWidth={2} />
                    </span>
                </button>
                {image && (
                    <button
                        type="button"
                        onClick={() => {
                            URL.revokeObjectURL(image);
                            setImage(null);
                        }}
                        className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm transition-colors hover:bg-neutral-900 hover:text-white"
                        aria-label="Remove picture"
                    >
                        <X className="size-3" />
                    </button>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFile}
                />
            </div>

            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-[12px] text-neutral-400 transition-colors hover:text-neutral-900"
            >
                {image ? "Change photo" : "Add photo"}
            </button>

            {/* Name */}
            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Group name"
                autoComplete="off"
                maxLength={40}
                autoFocus
                className="mt-4 h-10 w-full rounded-full border border-neutral-200 bg-neutral-50 px-4 text-center text-[14px] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white"
            />

            {/* Submit */}
            <button
                type="submit"
                disabled={!canSubmit}
                className="mt-auto flex h-10 w-full items-center justify-center rounded-full bg-neutral-900 text-[14px] text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
                Create group
            </button>
        </form>
    );
}

/* ------------------------------------------------------------------ */
/* Self-contained modal shell (dialog on desktop, drawer on mobile)    */
/* ------------------------------------------------------------------ */

export function CreateGroupModal({ open, onOpenChange, onCreate }) {
    const isMobile = useIsMobile();
    const [mounted, setMounted] = React.useState(false);
    const [visible, setVisible] = React.useState(false);

    // Handle enter/exit animation + delayed unmount.
    React.useEffect(() => {
        if (open) {
            setMounted(true);
            const id = requestAnimationFrame(() => setVisible(true));
            return () => cancelAnimationFrame(id);
        }
        setVisible(false);
        const t = setTimeout(() => setMounted(false), 250);
        return () => clearTimeout(t);
    }, [open]);

    // Escape to close + lock body scroll while open.
    React.useEffect(() => {
        if (!mounted) return;
        const onKey = (e) => {
            if (e.key === "Escape") onOpenChange(false);
        };
        window.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [mounted, onOpenChange]);

    const handleSubmit = (group) => {
        onCreate?.(group);
        onOpenChange(false);
    };

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Overlay */}
            <div
                onClick={() => onOpenChange(false)}
                className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"
                    }`}
            />

            {/* Panel */}
            {isMobile ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Create group"
                    className={`absolute inset-x-0 bottom-0 rounded-t-[1.5rem] bg-white shadow-2xl transition-transform duration-300 ease-out ${visible ? "translate-y-0" : "translate-y-full"
                        }`}
                    style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
                >
                    <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-neutral-200" />
                    <div className="h-[280px] px-6 pb-7 pt-4">
                        <GroupForm onSubmit={handleSubmit} />
                    </div>
                </div>
            ) : (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Create group"
                    className={`relative m-auto h-[270px] w-[280px] rounded-[1.5rem] bg-white p-5 shadow-2xl transition-all duration-200 ease-out ${visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
                        }`}
                >
                    <GroupForm onSubmit={handleSubmit} />
                </div>
            )}
        </div>
    );
}