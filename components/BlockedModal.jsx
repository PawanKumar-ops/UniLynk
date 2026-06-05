"use client";

import { Ban } from "lucide-react";

export function BlockedModal({ open, onOpenChange, userName }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.18)" }}
    >
      <div
        className="bg-white rounded-3xl flex flex-col items-center justify-between box-border"
        style={{
          width: "320px",
          height: "280px",
          padding: "28px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.13)",
        }}
      >
        {/* Icon */}
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: 52, height: 52, backgroundColor: "#fff2f2" }}
        >
          <Ban size={22} strokeWidth={1.6} style={{ color: "#e50505" }} />
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span
            className="text-[15px] text-[#0a0a14]"
            style={{ fontWeight: 600, lineHeight: 1.4 }}
          >
            You've been blocked
          </span>
          <span className="text-[13px] leading-[1.5]" style={{ color: "#717182" }}>
            {userName || "this user"} has blocked you. You can no longer send them messages.
          </span>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5 w-full mt-1">
          <button
            onClick={() => onOpenChange?.(false)}
            className="w-full rounded-full py-2.5 text-[14px] transition-colors cursor-pointer"
            style={{ border: "1.5px solid #e0e0e6", background: "#fff", color: "#0a0a14", fontWeight: 500 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f8fb")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
          >
            Got it
          </button>
          <button
            onClick={() => onOpenChange?.(false)}
            className="w-full rounded-full py-2.5 text-[14px] transition-colors cursor-pointer"
            style={{ background: "#ececf0", color: "#717182", border: "none", fontWeight: 500 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e4e4ea")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ececf0")}
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
