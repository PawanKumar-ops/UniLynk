import { useEffect, useRef, useState } from "react";
import {
  Image as ImageIcon,
  Smile,
  BarChart3,
  X,
  Plus,
  Pencil,
  Film,
  Globe2,
  Trash2,
} from "lucide-react";
const PlusIcon = Plus;
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type MediaItem = {
  id: string;
  url: string;
  kind: "image" | "gif" | "video";
};

const EMOJIS = [
  "😀","😂","🥲","😊","😍","😎","🤩","🤗","🤔","😴",
  "😭","😡","🤯","🥳","😇","🤤","😜","🙃","🤫","🤥",
  "❤️","🔥","✨","🎉","💯","👀","🙌","👏","🙏","💀",
  "🚀","🌈","🌙","☀️","⭐","🍀","🌸","🍕","☕","🍷",
];

const GIFS = [
  "https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif",
  "https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif",
  "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
  "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
  "https://media.giphy.com/media/26gsspfBl4VfFhSHC/giphy.gif",
  "https://media.giphy.com/media/3o7TKsQ8gqVrxZw1Vu/giphy.gif",
];

export function PostFab() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollDays, setPollDays] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_MEDIA = 4;
  const MAX_CHARS = 280;
  const remaining = MAX_CHARS - text.length;
  const canPost =
    (text.trim().length > 0 || media.length > 0 ||
      (showPoll && pollOptions.filter((p) => p.trim()).length >= 2)) &&
    remaining >= 0;

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [text, open]);

  const close = () => {
    setOpen(false);
    setText("");
    setMedia([]);
    setShowPoll(false);
    setPollOptions(["", ""]);
    setPollDays(1);
  };

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_MEDIA - media.length;
    const arr = Array.from(files).slice(0, remaining);
    const next: MediaItem[] = arr.map((f) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(f),
      kind: f.type.startsWith("video")
        ? "video"
        : f.type.includes("gif")
        ? "gif"
        : "image",
    }));
    setMedia((m) => [...m, ...next]);
  };

  const removeMedia = (id: string) =>
    setMedia((m) => m.filter((x) => x.id !== id));

  const addPollOption = () =>
    setPollOptions((p) => (p.length < 4 ? [...p, ""] : p));
  const updatePollOption = (i: number, v: string) =>
    setPollOptions((p) => p.map((x, idx) => (idx === i ? v : x)));
  const removePollOption = (i: number) =>
    setPollOptions((p) => (p.length > 2 ? p.filter((_, idx) => idx !== i) : p));

  const ringDeg = Math.min(360, ((MAX_CHARS - Math.max(remaining, 0)) / MAX_CHARS) * 360);
  const ringColor =
    remaining < 0 ? "#ef4444" : remaining <= 20 ? "#f59e0b" : "#111111";

  return (
    <>
      {/* FAB trigger */}
      {!open && (
        <button
          aria-label="Create post"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-black text-white shadow-[0_10px_30px_-8px_rgba(0,0,0,0.45)] ring-1 ring-black/5 transition-all duration-300 hover:scale-105 hover:shadow-[0_18px_40px_-10px_rgba(0,0,0,0.55)] active:scale-95"
        >
          <Pencil className="h-5 w-5" strokeWidth={2.25} />
        </button>
      )}

      {/* Backdrop + expanded FAB */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end bg-black/30 p-6 backdrop-blur-sm sm:items-end sm:justify-end animate-in fade-in duration-200"
          onClick={close}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "565.35px", maxWidth: "calc(100vw - 24px)" }}
            className="relative max-h-[90vh] overflow-hidden rounded-3xl bg-white text-black shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] ring-1 ring-black/10 animate-in slide-in-from-bottom-4 fade-in duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/5 px-5 py-3">
              <button
                onClick={close}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full text-black/70 transition hover:bg-black/5"
              >
                <X className="h-5 w-5" />
              </button>
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-black/40">
                New Post
              </span>
              <div className="h-9 w-9" />
            </div>

            <div className="max-h-[calc(90vh-64px)] overflow-y-auto px-5 pt-4 pb-3">
              {/* Composer body */}
              <div className="flex gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-neutral-900 to-neutral-600 ring-1 ring-black/10" />
                <div className="flex-1">
                  {/* Audience pill */}
                  <button className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-0.5 text-xs font-semibold text-black transition hover:bg-black/5">
                    <Globe2 className="h-3.5 w-3.5" />
                    Everyone
                  </button>

                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="What's happening?"
                    rows={2}
                    className="w-full resize-none border-0 bg-transparent text-[20px] leading-relaxed text-black placeholder:text-black/35 focus:outline-none focus:ring-0"
                  />

                  {/* Media grid */}
                  {media.length > 0 && (
                    <div
                      className={`mt-2 grid gap-1.5 overflow-hidden rounded-2xl ring-1 ring-black/10 ${
                        media.length === 1
                          ? "grid-cols-1"
                          : media.length === 2
                          ? "grid-cols-2"
                          : media.length === 3
                          ? "grid-cols-2 grid-rows-2"
                          : "grid-cols-2 grid-rows-2"
                      }`}
                    >
                      {media.map((m, i) => (
                        <div
                          key={m.id}
                          className={`relative ${
                            media.length === 3 && i === 0
                              ? "row-span-2"
                              : ""
                          }`}
                        >
                          {m.kind === "video" ? (
                            <video
                              src={m.url}
                              className="h-full w-full object-cover"
                              style={{ aspectRatio: media.length === 1 ? "16/10" : "1/1" }}
                            />
                          ) : (
                            <img
                              src={m.url}
                              alt=""
                              className="h-full w-full object-cover"
                              style={{ aspectRatio: media.length === 1 ? "16/10" : "1/1" }}
                            />
                          )}
                          {m.kind === "video" && (
                            <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                              <Film className="h-3 w-3" /> Paused
                            </div>
                          )}
                          {m.kind === "gif" && (
                            <div className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                              GIF
                            </div>
                          )}
                          <button
                            onClick={() => removeMedia(m.id)}
                            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white backdrop-blur transition hover:bg-black"
                            aria-label="Remove"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Poll */}
                  {showPoll && (
                    <div className="mt-3 rounded-2xl border border-black/10 p-3">
                      <div className="space-y-2">
                        {pollOptions.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <input
                                value={opt}
                                maxLength={25}
                                onChange={(e) =>
                                  updatePollOption(i, e.target.value)
                                }
                                placeholder={`Choice ${i + 1}`}
                                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 pr-12 text-sm text-black placeholder:text-black/35 transition focus:border-black focus:outline-none"
                              />
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-black/35">
                                {opt.length}/25
                              </span>
                            </div>
                            {pollOptions.length > 2 && (
                              <button
                                onClick={() => removePollOption(i)}
                                aria-label="Remove option"
                                className="grid h-8 w-8 place-items-center rounded-full text-black/50 transition hover:bg-black/5 hover:text-black"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        {pollOptions.length < 4 && (
                          <button
                            onClick={addPollOption}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-black/70 transition hover:text-black"
                          >
                            <PlusIcon className="h-3.5 w-3.5" /> Add choice
                          </button>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3">
                        <div className="flex items-center gap-2 text-xs text-black/60">
                          <span className="font-semibold">Duration</span>
                          <select
                            value={pollDays}
                            onChange={(e) =>
                              setPollDays(Number(e.target.value))
                            }
                            className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs text-black focus:border-black focus:outline-none"
                          >
                            {[1, 2, 3, 7].map((d) => (
                              <option key={d} value={d}>
                                {d} day{d > 1 ? "s" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() => {
                            setShowPoll(false);
                            setPollOptions(["", ""]);
                          }}
                          className="text-xs font-semibold text-black/60 transition hover:text-black"
                        >
                          Remove poll
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer toolbar */}
            <div className="flex items-center justify-between gap-3 border-t border-black/5 bg-white px-5 py-3">
              <div className="flex items-center gap-0.5">
                {/* Image */}
                <ToolbarBtn
                  label="Image"
                  disabled={media.length >= MAX_MEDIA || showPoll}
                  onClick={() => fileRef.current?.click()}
                >
                  <ImageIcon className="h-[18px] w-[18px]" />
                </ToolbarBtn>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  hidden
                  onChange={(e) => {
                    onFiles(e.target.files);
                    e.target.value = "";
                  }}
                />

                {/* GIF */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      disabled={media.length >= MAX_MEDIA || showPoll}
                      className="grid h-9 w-9 place-items-center rounded-full text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="GIF"
                    >
                      <span className="text-[11px] font-extrabold tracking-tight">
                        GIF
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    className="w-72 rounded-2xl border-black/10 p-2"
                  >
                    <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-black/50">
                      Trending
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {GIFS.map((g) => (
                        <button
                          key={g}
                          onClick={() => {
                            if (media.length >= MAX_MEDIA) return;
                            setMedia((m) => [
                              ...m,
                              { id: crypto.randomUUID(), url: g, kind: "gif" },
                            ]);
                          }}
                          className="overflow-hidden rounded-lg ring-1 ring-black/10 transition hover:ring-black"
                        >
                          <img
                            src={g}
                            alt="gif"
                            className="h-24 w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Poll */}
                <ToolbarBtn
                  label="Poll"
                  disabled={media.length > 0}
                  onClick={() => setShowPoll((s) => !s)}
                  active={showPoll}
                >
                  <BarChart3 className="h-[18px] w-[18px]" />
                </ToolbarBtn>

                {/* Emoji */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="grid h-9 w-9 place-items-center rounded-full text-black transition hover:bg-black/5"
                      aria-label="Emoji"
                    >
                      <Smile className="h-[18px] w-[18px]" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    className="w-72 rounded-2xl border-black/10 p-3"
                  >
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-black/50">
                      Frequently used
                    </div>
                    <div className="grid grid-cols-8 gap-1">
                      {EMOJIS.map((e) => (
                        <button
                          key={e}
                          onClick={() => setText((t) => t + e)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-lg transition hover:bg-black/5"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-3">
                {/* Char ring */}
                {text.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div
                      className="relative h-6 w-6 rounded-full"
                      style={{
                        background: `conic-gradient(${ringColor} ${ringDeg}deg, rgba(0,0,0,0.08) 0deg)`,
                      }}
                    >
                      <div className="absolute inset-[3px] rounded-full bg-white" />
                      {remaining <= 20 && (
                        <div
                          className="absolute inset-0 grid place-items-center text-[10px] font-semibold"
                          style={{ color: ringColor }}
                        >
                          {remaining}
                        </div>
                      )}
                    </div>
                    <div className="h-6 w-px bg-black/10" />
                    <button
                      disabled={media.length >= MAX_MEDIA}
                      className="grid h-7 w-7 place-items-center rounded-full border border-black/15 text-black transition hover:bg-black/5 disabled:opacity-30"
                      aria-label="Add post"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <Button
                  disabled={!canPost}
                  onClick={close}
                  className="h-9 rounded-full bg-black px-5 text-sm font-bold text-white shadow-sm transition hover:bg-black/85 disabled:bg-black/30 disabled:text-white"
                >
                  Post
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ToolbarBtn({
  children,
  onClick,
  disabled,
  active,
  label,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`grid h-9 w-9 place-items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-30 ${
        active ? "bg-black text-white" : "text-black hover:bg-black/5"
      }`}
    >
      {children}
    </button>
  );
}
