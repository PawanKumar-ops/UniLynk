"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { X, RotateCcw, ZoomIn, ZoomOut, Check, Move } from "lucide-react";

const MAX_ZOOM = 4;

export default function CropModal({ src, aspect, title, round, onCancel, onApply }) {
  const frameRef = useRef(null);
  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const [nat, setNat] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef(null);

  // Base scale = "cover" so the image always fills the frame with no gaps (X/Twitter style).
  const baseScale = nat.w && frame.w ? Math.max(frame.w / nat.w, frame.h / nat.h) : 1;
  const dispW = nat.w * baseScale * zoom;
  const dispH = nat.h * baseScale * zoom;

  // How far the image can travel before the frame would leave the image.
  const clamp = (o) => {
    const maxX = Math.max(0, (dispW - frame.w) / 2);
    const maxY = Math.max(0, (dispH - frame.h) / 2);
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
    img.crossOrigin = "anonymous";
    img.onload = () => setNat({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src]);

  // Keep the offset valid whenever zoom / sizes change.
  useEffect(() => {
    setOffset((o) => clamp(o));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, frame.w, frame.h, nat.w, nat.h]);

  useEffect(() => {
    const stop = () => (drag.current = null);
    window.addEventListener("pointerup", stop);
    return () => window.removeEventListener("pointerup", stop);
  }, []);

  // Non-passive wheel listener so we can stop the page from scrolling while zooming.
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
      }),
    );
  };

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const apply = () => {
    if (!nat.w || !frame.w) return onApply(src);
    const out = 1000;
    const canvas = document.createElement("canvas");
    canvas.width = out;
    canvas.height = Math.round(out / aspect);
    const ctx = canvas.getContext("2d");
    if (!ctx) return onApply(src);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const k = canvas.width / frame.w;
      const dx = (frame.w - dispW) / 2 + offset.x;
      const dy = (frame.h - dispH) / 2 + offset.y;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, dx * k, dy * k, dispW * k, dispH * k);
      onApply(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => onApply(src);
    img.src = src;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onCancel} />
      <div
        className={`relative max-h-[92vh] w-full overflow-y-auto rounded-[20px] border border-hair bg-white p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)] ${
          round ? "max-w-[400px]" : "max-w-xl"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Adjust</p>
            <h3 className="font-display text-lg font-semibold">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="grid size-9 place-items-center rounded-full border border-hair text-muted transition hover:bg-neutral-100 hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <div
          ref={frameRef}
          onPointerMove={onMove}
          onPointerDown={(e) =>
            (drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y })
          }
          className="relative mx-auto w-full cursor-grab touch-none select-none overflow-hidden rounded-2xl border border-hair bg-neutral-900 active:cursor-grabbing"
          style={{ aspectRatio: String(aspect) }}
        >
          {nat.w > 0 && (
            <img
              src={src}
              alt="crop preview"
              draggable={false}
              className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
              style={{
                width: dispW,
                height: dispH,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
            />
          )}
          {/* dimmed area outside the crop selection */}
          <div
            className={`pointer-events-none absolute inset-0 shadow-[0_0_0_2000px_rgba(0,0,0,0.45)] ${
              round ? "rounded-full" : ""
            }`}
          />
          {/* rule-of-thirds guides */}
          <div
            className={`pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 overflow-hidden ${
              round ? "rounded-full" : ""
            }`}
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-white/30" />
            ))}
          </div>
          <div className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">
            <Move className="size-3" /> Drag to reposition · scroll to zoom
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
            className="grid size-8 shrink-0 place-items-center rounded-full border border-hair text-muted transition hover:bg-neutral-100 hover:text-ink"
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
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-hair accent-ink"
          />
          <button
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.25))}
            className="grid size-8 shrink-0 place-items-center rounded-full border border-hair text-muted transition hover:bg-neutral-100 hover:text-ink"
          >
            <ZoomIn className="size-4" />
          </button>
          <button
            onClick={reset}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-hair px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-neutral-100 hover:text-ink"
          >
            <RotateCcw className="size-3.5" /> Reset
          </button>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-full border border-hair px-5 py-2.5 text-sm font-medium transition hover:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            onClick={apply}
            className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            <Check className="size-4" /> Apply
          </button>
        </div>
      </div>
    </div>
  );
}
