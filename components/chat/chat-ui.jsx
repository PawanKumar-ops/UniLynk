"use client";

import { useEffect, useRef, useState } from "react";
import { X, Search, Smile, Image as ImageIcon, Video, FileIcon, FileText, Users, Megaphone, Check, Camera, Trash2, Sparkles, Ban, Download, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { DOCUMENT_ACCEPT, DOCUMENT_TYPES, documentExtension, documentFileUrl, documentViewUrl, formatFileSize } from "@/lib/documents";
import { DocumentBadge } from "@/components/PostDocument";
import { gifs, emojis, stickers } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { loreleiAvatar } from "@/lib/avatar";

export function PickerPopover({
  type,
  onClose,
  onPick,
}) {
  const [q, setQ] = useState("");
  if (!type) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-20 left-4 z-50 w-[340px] rounded-2xl border bg-[#fff] shadow-2xl animate-scale-in origin-bottom-left">
        <div className="flex items-center gap-2 border-b p-3">
          <Search className="h-4 w-4 text-[#62748e]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${type === "gif" ? "GIFs" : type === "sticker" ? "stickers" : "emojis"}`}
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <button onClick={onClose} className="rounded-full p-1 hover:bg-[#f2f6fa]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto p-3">
          {type === "gif" && (
            <div className="grid grid-cols-2 gap-2">
              {gifs.map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    onPick(g);
                    onClose();
                  }}
                  className="overflow-hidden rounded-lg transition hover:opacity-80"
                >
                  <img src={g} alt="gif" className="h-28 w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {type === "emoji" && (
            <div className="grid grid-cols-8 gap-1">
              {emojis.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    onPick(e);
                    onClose();
                  }}
                  className="rounded-md p-2 text-2xl transition hover:bg-[#f2f6fa]"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
          {type === "sticker" && (
            <div className="grid grid-cols-3 gap-2">
              {stickers.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onPick(s);
                    onClose();
                  }}
                  className="rounded-lg p-2 transition hover:bg-[#f2f6fa]"
                >
                  <img src={s} alt="sticker" className="h-20 w-full" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function PlusDropdown({
  onPickFile,
  onClose,
}) {
  const imgRef = useRef(null);
  const vidRef = useRef(null);
  const fileRef = useRef(null);
  const items = [
    { icon: ImageIcon, label: "Photo", ref: imgRef, accept: "image/*" },
    { icon: Video, label: "Video", ref: vidRef, accept: "video/*" },
    { icon: FileText, label: "Document", ref: fileRef, accept: DOCUMENT_ACCEPT },
  ];
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-14 left-0 z-50 w-48 overflow-hidden rounded-2xl border bg-[#fff] shadow-2xl animate-scale-in origin-bottom-left">
        {items.map((it) => (
          <button
            key={it.label}
            onClick={() => it.ref.current?.click()}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-[#f2f6fa]"
          >
            <it.icon className="h-5 w-5 text-[#1d9bf0]" />
            {it.label}
            <input
              ref={it.ref}
              type="file"
              accept={it.accept}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  onPickFile(f);
                  onClose();
                }
              }}
            />
          </button>
        ))}
      </div>
    </>
  );
}

export function ReactionPicker({
  onPick,
  onClose,
  align = "left",
}) {
  const quick = ["❤️", "😂", "😮", "😢", "😡", "👍", "🔥"];
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className={cn(
          "absolute -top-12 z-50 flex gap-1 rounded-full border bg-[#fff] px-2 py-1.5 shadow-xl animate-scale-in",
          align === "right" ? "right-0 origin-bottom-right" : "left-0 origin-bottom-left",
        )}
      >
        {quick.map((e) => (
          <button
            key={e}
            onClick={() => {
              onPick(e);
              onClose();
            }}
            className="rounded-full p-1 text-xl transition hover:scale-125"
          >
            {e}
          </button>
        ))}
      </div>
    </>
  );
}

export function Modal({
  open,
  onClose,
  children,
  className,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 animate-fade-in">
      <button
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="close"
      />
      <div
        className={cn(
          "relative z-10 max-h-[90vh] w-full max-w-md overflow-hidden rounded-2xl bg-[#fff] shadow-2xl animate-scale-in",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function NewMessageModal({
  open,
  onClose,
  onPick,
}) {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/chat/users", { cache: "no-store" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok) {
          setUsers((data.users || []).map((user) => ({
            id: user.id,
            name: user.name || user.email || "UniLynk User",
            handle: user.email?.split("@")[0] || "user",
            avatar: user.image || loreleiAvatar(user.email),
          })));
        }
      })
      .catch(console.error);
  }, [open]);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(q.toLowerCase()) ||
      u.handle.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex items-center gap-4 border-b px-4 py-3">
        <button onClick={onClose} className="rounded-full p-2 hover:bg-[#f2f6fa]">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-bold">New message</h2>
        <button className="ml-auto rounded-full bg-[#000] px-4 py-1.5 text-sm font-bold text-[#fff] opacity-50">
          Next
        </button>
      </div>
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <Search className="h-4 w-4 text-[#62748e]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search people"
          className="flex-1 bg-transparent py-2 text-sm outline-none"
          autoFocus
        />
      </div>
      <div className="max-h-96 overflow-y-auto">
        {filtered.map((u) => (
          <button
            key={u.id}
            onClick={() => {
              onPick(u);
              onClose();
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#f2f6fa]"
          >
            <img src={u.avatar} alt={u.name} className="h-10 w-10 rounded-full bg-[#f2f6fa]" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold">{u.name}</div>
              <div className="truncate text-sm text-[#62748e]">@{u.handle}</div>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
}

export function MediaPreviewBar({
  file,
  onRemove,
}) {
  const isImg = file.type?.startsWith("image");
  const isVid = file.type?.startsWith("video");
  const ext = documentExtension(file.name);
  return (
    <div className="border-t bg-[#fff] px-3 pt-3">
      <div className="relative inline-block max-w-full">
        {isImg && file.url && (
          <img src={file.url} alt={file.name} className="max-h-48 rounded-2xl object-cover" />
        )}
        {isVid && file.url && (
          <video src={file.url} controls className="max-h-48 rounded-2xl" />
        )}
        {(!isImg && !isVid) || !file.url ? (
          <div className="flex w-[300px] max-w-[calc(100vw-3rem)] items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-[#f7f9fa] p-2.5 pr-10">
            {isImg || isVid ? (
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#1d9bf0]/10 text-[#1d9bf0]">
                {isImg ? <ImageIcon className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </span>
            ) : (
              <DocumentBadge ext={ext} size={40} />
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold text-[#0f1419]">{file.name}</span>
              <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#62748e]">
                {file.uploading ? (
                  <><Loader2 className="h-3 w-3 animate-spin text-[#1d9bf0]" /> Uploading…</>
                ) : (
                  [DOCUMENT_TYPES[ext]?.label || (isImg ? "Photo" : isVid ? "Video" : "File"), file.size ? formatFileSize(file.size) : ""].filter(Boolean).join(" · ")
                )}
              </span>
            </span>
          </div>
        ) : null}
        <button
          onClick={onRemove}
          aria-label="Remove attachment"
          className="absolute -right-2 -top-2 rounded-full bg-[#000] p-1 text-[#fff] shadow"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Document sent in a chat: file card with Open and Download actions. */
export function ChatDocumentCard({ attachment, mine, time, read }) {
  const doc = { url: attachment.url, name: attachment.fileName || "Document", size: attachment.size };
  const ext = documentExtension(doc.name) || documentExtension(doc.url);
  const details = [DOCUMENT_TYPES[ext]?.label || ext.toUpperCase() || "File", doc.size ? formatFileSize(doc.size) : ""].filter(Boolean).join(" · ");
  return (
    <div
      className={cn(
        "w-[290px] max-w-[78vw] overflow-hidden rounded-2xl border shadow-sm animate-fade-in sm:max-w-[320px]",
        mine ? "rounded-br-[7px] border-[#1d9bf0] bg-[#1d9bf0] text-white" : "rounded-bl-[7px] border-[#e5e7eb] bg-white text-[#0f1419]"
      )}
    >
      <a
        href={documentViewUrl({ ...doc, ext })}
        target="_blank"
        rel="noopener noreferrer"
        title={`Open ${doc.name}`}
        className={cn("flex items-center gap-3 p-3 no-underline transition", mine ? "hover:bg-white/10" : "hover:bg-[#f7f9fa]")}
      >
        <span className={cn("rounded-xl", mine && "bg-white p-1")}>
          <DocumentBadge ext={ext} size={mine ? 36 : 44} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 break-all text-[14px] font-semibold leading-snug">{doc.name}</span>
          <span className={cn("mt-0.5 block text-[12px]", mine ? "text-white/80" : "text-[#62748e]")}>{details}</span>
        </span>
      </a>
      <div className={cn("flex items-center border-t text-[13px] font-semibold", mine ? "border-white/20" : "border-[#eff3f4]")}>
        <a
          href={documentViewUrl({ ...doc, ext })}
          target="_blank"
          rel="noopener noreferrer"
          className={cn("flex flex-1 items-center justify-center gap-1.5 py-2 transition", mine ? "hover:bg-white/10" : "text-[#1d9bf0] hover:bg-[#f7f9fa]")}
        >
          <ExternalLink className="h-3.5 w-3.5" /> Open
        </a>
        <span className={cn("h-5 w-px", mine ? "bg-white/20" : "bg-[#eff3f4]")} />
        <a
          href={documentFileUrl(doc, { download: true })}
          className={cn("flex flex-1 items-center justify-center gap-1.5 py-2 transition", mine ? "hover:bg-white/10" : "text-[#1d9bf0] hover:bg-[#f7f9fa]")}
        >
          <Download className="h-3.5 w-3.5" /> Download
        </a>
      </div>
      <div className={cn("flex items-center justify-end gap-1 px-3 pb-1.5 text-[11px]", mine ? "text-white/80" : "text-[#62748e]")}>
        {time}{read && <CheckCircle2 className="h-3 w-3" />}
      </div>
    </div>
  );
}

export function CallModal({
  open,
  onClose,
  user,
  video,
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col items-center gap-4 bg-gradient-to-br from-[#1d9bf0]/20 to-[#fff] p-10">
        <img src={user.avatar} alt={user.name} className="h-28 w-28 rounded-full ring-4 ring-[#fff]" />
        <div className="text-center">
          <div className="text-2xl font-bold">{user.name}</div>
          <div className="text-sm text-[#62748e]">
            {video ? "Video calling…" : "Calling…"}
          </div>
        </div>
        <div className="mt-4 flex h-2 w-32 overflow-hidden rounded-full bg-[#f2f6fa]">
          <div className="h-full w-1/3 animate-pulse bg-[#1d9bf0]" />
        </div>
        <div className="mt-6 flex gap-4">
          <button
            onClick={onClose}
            className="rounded-full bg-red-500 px-8 py-3 font-bold text-white shadow-lg hover:bg-red-600"
          >
            End call
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function DotsMenu({
  onClose,
  items,
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border bg-[#fff] shadow-2xl animate-scale-in origin-top-right">
        {items.map((it) => (
          <button
            key={it.label}
            onClick={() => {
              it.onClick?.();
              onClose();
            }}
            className={cn(
              "block w-full px-4 py-3 text-left text-sm font-semibold hover:bg-[#f2f6fa]",
              it.danger && "text-red-500",
            )}
          >
            {it.label}
          </button>
        ))}
      </div>
    </>
  );
}

export { Smile };


const GROUP_GRADIENTS = [
  { id: "indigo", from: "#6366f1", to: "#8b5cf6" },
  { id: "rose", from: "#f43f5e", to: "#ec4899" },
  { id: "amber", from: "#f59e0b", to: "#f97316" },
  { id: "emerald", from: "#10b981", to: "#22c55e" },
  { id: "sky", from: "#0ea5e9", to: "#22d3ee" },
  { id: "violet", from: "#7c3aed", to: "#a855f7" },
  { id: "slate", from: "#334155", to: "#64748b" },
  { id: "sunset", from: "#ef4444", to: "#f59e0b" },
];


export function BlockUserModal({ open, onOpenChange, onConfirm, userName }) {
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
            Block {userName || "this user"}?
          </span>
          <span className="text-[13px] leading-[1.5]" style={{ color: "#717182" }}>
            They won't be able to send you messages. You can unblock them at any time.
          </span>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5 w-full mt-1">
          <button
            onClick={() => onConfirm?.()}
            className="w-full rounded-full py-2.5 text-[14px] transition-colors cursor-pointer"
            style={{ border: "1.5px solid #e0e0e6", background: "#fff", color: "#0a0a14", fontWeight: 500 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f8fb")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
          >
            Block
          </button>
          <button
            onClick={() => onOpenChange?.(false)}
            className="w-full rounded-full py-2.5 text-[14px] transition-colors cursor-pointer"
            style={{ background: "#ececf0", color: "#717182", border: "none", fontWeight: 500 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e4e4ea")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ececf0")}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

