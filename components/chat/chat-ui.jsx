"use client";

import { useEffect, useRef, useState } from "react";
import { X, Search, Smile, Image as ImageIcon, Video, FileIcon, Mic } from "lucide-react";
import { gifs, emojis, stickers, allUsers } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

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
      <div className="absolute bottom-20 left-4 z-50 w-[340px] rounded-2xl border bg-popover shadow-2xl animate-scale-in origin-bottom-left">
        <div className="flex items-center gap-2 border-b p-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${type === "gif" ? "GIFs" : type === "sticker" ? "stickers" : "emojis"}`}
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted">
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
                  className="rounded-md p-2 text-2xl transition hover:bg-muted"
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
                  className="rounded-lg p-2 transition hover:bg-muted"
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
    { icon: FileIcon, label: "File", ref: fileRef, accept: "*" },
  ];
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-14 left-0 z-50 w-48 overflow-hidden rounded-2xl border bg-popover shadow-2xl animate-scale-in origin-bottom-left">
        {items.map((it) => (
          <button
            key={it.label}
            onClick={() => it.ref.current?.click()}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-muted"
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
          "absolute -top-12 z-50 flex gap-1 rounded-full border bg-popover px-2 py-1.5 shadow-xl animate-scale-in",
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
      <div
        className={cn(
          "relative max-h-[90vh] w-full max-w-md overflow-hidden rounded-2xl bg-background shadow-2xl animate-scale-in",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
      <button
        className="absolute inset-0 -z-0"
        onClick={onClose}
        aria-label="close"
      />
    </div>
  );
}

export function NewMessageModal({
  open,
  onClose,
  onPick,
}) {
  const [q, setQ] = useState("");
  const filtered = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(q.toLowerCase()) ||
      u.handle.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex items-center gap-4 border-b px-4 py-3">
        <button onClick={onClose} className="rounded-full p-2 hover:bg-muted">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-bold">New message</h2>
        <button className="ml-auto rounded-full bg-foreground px-4 py-1.5 text-sm font-bold text-background opacity-50">
          Next
        </button>
      </div>
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
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
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted"
          >
            <img src={u.avatar} alt={u.name} className="h-10 w-10 rounded-full bg-muted" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold">{u.name}</div>
              <div className="truncate text-sm text-muted-foreground">@{u.handle}</div>
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
  const isImg = file.type.startsWith("image");
  const isVid = file.type.startsWith("video");
  return (
    <div className="border-t bg-background p-3">
      <div className="relative inline-block">
        {isImg && (
          <img src={file.url} alt={file.name} className="max-h-48 rounded-2xl object-cover" />
        )}
        {isVid && (
          <video src={file.url} controls className="max-h-48 rounded-2xl" />
        )}
        {!isImg && !isVid && (
          <div className="flex items-center gap-2 rounded-2xl border bg-muted px-4 py-3 text-sm">
            <FileIcon className="h-5 w-5" />
            {file.name}
          </div>
        )}
        <button
          onClick={onRemove}
          className="absolute -right-2 -top-2 rounded-full bg-foreground p-1 text-background shadow"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function VoiceRecorder({ onClose }) {
  const [s, setS] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setS((x) => x + 1), 1000);
    return () => clearInterval(i);
  }, []);
  return (
    <div className="flex items-center gap-3 border-t bg-background px-4 py-3 animate-fade-in">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
        <Mic className="h-5 w-5 text-red-500 animate-pulse" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold">Recording…</div>
        <div className="text-xs text-muted-foreground">
          {Math.floor(s / 60)}:{(s % 60).toString().padStart(2, "0")}
        </div>
      </div>
      <button
        onClick={onClose}
        className="rounded-full bg-muted px-4 py-2 text-sm font-semibold hover:bg-muted/70"
      >
        Cancel
      </button>
      <button
        onClick={onClose}
        className="rounded-full bg-[#1d9bf0] px-4 py-2 text-sm font-semibold text-white"
      >
        Send
      </button>
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
      <div className="flex flex-col items-center gap-4 bg-gradient-to-br from-[#1d9bf0]/20 to-background p-10">
        <img src={user.avatar} alt={user.name} className="h-28 w-28 rounded-full ring-4 ring-background" />
        <div className="text-center">
          <div className="text-2xl font-bold">{user.name}</div>
          <div className="text-sm text-muted-foreground">
            {video ? "Video calling…" : "Calling…"}
          </div>
        </div>
        <div className="mt-4 flex h-2 w-32 overflow-hidden rounded-full bg-muted">
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
      <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border bg-popover shadow-2xl animate-scale-in origin-top-right">
        {items.map((it) => (
          <button
            key={it.label}
            onClick={() => {
              it.onClick?.();
              onClose();
            }}
            className={cn(
              "block w-full px-4 py-3 text-left text-sm font-semibold hover:bg-muted",
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
