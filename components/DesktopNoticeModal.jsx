import { useEffect } from "react";

export default function DesktopNoticeModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="desktop-notice-title"
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      style={{ animation: "overlay-in 240ms ease-out" }}
    >
      {/* Backdrop */}
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
      />

      {/* Sheet */}
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-black/10 bg-white text-black shadow-[0_24px_80px_-20px_rgba(0,0,0,0.45)]"
        style={{ animation: "sheet-in 420ms cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Dismiss"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-black/5 hover:text-black"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M3 3l9 9M12 3l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <div className="flex flex-col items-center px-8 pb-9 pt-11 text-center">
          {/* Icon */}
          <div className="relative mb-7 flex h-20 w-20 items-center justify-center">
            <svg className="absolute inset-0" width="80" height="80" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="black"
                strokeWidth="1.5"
                strokeDasharray="283"
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                style={{ animation: "ring-draw 900ms cubic-bezier(0.16, 1, 0.3, 1) 120ms both" }}
              />
            </svg>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="text-black">
              <rect x="2" y="4" width="20" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>

          <span className="mb-3 rounded-full border border-black/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-black/50">
            Best on desktop
          </span>

          <h2
            id="desktop-notice-title"
            className="mb-3 text-3xl leading-tight tracking-tight"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Made for a bigger screen
          </h2>

          <p className="mb-8 max-w-[19rem] text-[15px] leading-relaxed text-black/55">
            This experience is still finding its footing on mobile. For the full,
            polished view, open it on a laptop or desktop.
          </p>

          <div className="flex w-full flex-col gap-2.5">
            <button
              onClick={onClose}
              className="w-full rounded-full bg-black py-3.5 text-sm font-medium text-white transition-transform duration-200 hover:scale-[0.99] active:scale-[0.97]"
            >
              Continue on mobile
            </button>
            <button
              onClick={onClose}
              className="w-full rounded-full py-2.5 text-sm font-medium text-black/45 transition-colors hover:text-black"
            >
              Remind me later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
