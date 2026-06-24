import React, { useState, useEffect } from "react";

export default function RequestModal({
  open,
  onClose,
  onAccept,
  onReject,
  requester,
  formTitle,
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = "hidden";
    } else {
      setVisible(false);
      document.body.style.overflow = "";
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!mounted) return null;

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        transition-opacity duration-300 ease-out
        ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Modal / Drawer panel */}
      <div
        className={`
          relative w-full bg-white shadow-2xl
          sm:max-w-[22rem] sm:rounded-2xl sm:m-4 sm:border sm:border-black/5
          max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:rounded-t-2xl max-sm:border-t max-sm:border-black/5
          transition-transform duration-300 ease-out
          ${visible
            ? "sm:translate-y-0 max-sm:translate-y-0"
            : "sm:translate-y-4 sm:scale-95 max-sm:translate-y-full"
          }
        `}
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-black/10" />
        </div>

        <div className="px-6 pt-5 pb-6 sm:pt-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-black/40">
              Membership Request
            </h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-black/30 transition-colors hover:bg-black/5 hover:text-black/70"
              aria-label="Close"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4L4 12M4 4L12 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Profile */}
          <div className="flex items-center gap-4 mb-5">
            <a href={`/dashboard/Userprofile?userId=${encodeURIComponent(requester.id)}`} target="_blank" rel="noopener noreferrer" className="block">
              <img
                src={requester.avatar}
                alt={requester.name}
                className="h-12 w-12 rounded-full object-cover ring-1 ring-black/5 cursor-pointer"
                loading="lazy"
              />
            </a>
            <div>
              <p className="text-base font-semibold text-black requester-name hover:underline cursor-pointer">
                <a href={`/dashboard/Userprofile?userId=${encodeURIComponent(requester.id)}`} target="_blank" rel="noopener noreferrer" className="text-black">
                  {requester.name}
                </a>
              </p>
              <p className="text-xs text-black/40">wants to join your team{formTitle ? ` for ${formTitle}` : ""}</p>
            </div>
          </div>

          {/* Message */}
          <div className="mb-6 rounded-xl bg-black/[0.03] p-4">
            <p className="text-sm leading-relaxed text-black/70 whitespace-pre-wrap">
              {requester.message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onReject}
              className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black/70 transition-all hover:bg-black/[0.03] active:scale-[0.98]"
            >
              Decline
            </button>
            <button
              onClick={onAccept}
              className="flex-1 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-black/85 active:scale-[0.98]"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
