"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
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

const EMOJIS = [
  "😀", "😂", "🥲", "😊", "😍", "😎", "🤩", "🤗", "🤔", "😴",
  "😭", "😡", "🤯", "🥳", "😇", "🤤", "😜", "🙃", "🤫", "🤥",
  "❤️", "🔥", "✨", "🎉", "💯", "👀", "🙌", "👏", "🙏", "💀",
  "🚀", "🌈", "🌙", "☀️", "⭐", "🍀", "🌸", "🍕", "☕", "🍷",
];

const GIFS = [
  "https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif",
  "https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif",
  "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
  "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
  "https://media.giphy.com/media/26gsspfBl4VfFhSHC/giphy.gif",
  "https://media.giphy.com/media/3o7TKsQ8gqVrxZw1Vu/giphy.gif",
];

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function PostFab({ audience = "for-you", onPosted }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [media, setMedia] = useState([]);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollDays, setPollDays] = useState(1);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadershipClubs, setLeadershipClubs] = useState([]);
  const [showPostAsDrawer, setShowPostAsDrawer] = useState(false);
  const fileRef = useRef(null);
  const textareaRef = useRef(null);

  const MAX_MEDIA = 4;
  const MAX_CHARS = 280;
  const remaining = MAX_CHARS - text.length;
  const pollHasEnoughOptions = pollOptions.filter((p) => p.trim()).length >= 2;
  const hasReadyMedia = media.some((item) => item.url);
  const canPost =
    (text.trim().length > 0 || hasReadyMedia || (showPoll && pollHasEnoughOptions)) &&
    remaining >= 0 &&
    !isUploading &&
    !isSubmitting;

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text, open]);

  useEffect(() => {
    const fetchLeadershipClubs = async () => {
      try {
        const res = await fetch("/api/clubs?leadershipOnly=true", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) return;
        setLeadershipClubs(Array.isArray(data?.clubs) ? data.clubs : []);
      } catch (error) {
        console.error("Failed to load leadership clubs", error);
      }
    };

    fetchLeadershipClubs();
  }, []);

  const resetComposer = () => {
    setText("");
    setMedia([]);
    setShowPoll(false);
    setPollOptions(["", ""]);
    setPollDays(1);
    setShowGifPicker(false);
    setShowEmojiPicker(false);
    setShowPostAsDrawer(false);
  };

  const close = () => {
    setOpen(false);
    resetComposer();
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/posts/upload-image", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Image upload failed");

    return data.url;
  };

  const onFiles = async (files) => {
    if (!files) return;

    const remainingSlots = MAX_MEDIA - media.length;
    const arr = Array.from(files).slice(0, remainingSlots);
    if (!arr.length) return;

    setIsUploading(true);
    try {
      const uploaded = [];
      for (const file of arr) {
        const previewUrl = URL.createObjectURL(file);
        const kind = file.type.startsWith("video")
          ? "video"
          : file.type.includes("gif")
            ? "gif"
            : "image";
        const uploadedUrl = await uploadFile(file);
        uploaded.push({ id: createId(), url: uploadedUrl, previewUrl, kind });
      }
      setMedia((m) => [...m, ...uploaded].slice(0, MAX_MEDIA));
    } catch (error) {
      console.error(error);
      alert("Could not upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const removeMedia = (id) => {
    setMedia((m) => m.filter((x) => x.id !== id));
  };

  const addGif = (gifUrl) => {
    if (media.length >= MAX_MEDIA) return;
    setMedia((m) => [...m, { id: createId(), url: gifUrl, kind: "gif" }].slice(0, MAX_MEDIA));
    setShowGifPicker(false);
  };

  const addPollOption = () => {
    setPollOptions((p) => (p.length < 4 ? [...p, ""] : p));
  };

  const updatePollOption = (i, v) => {
    setPollOptions((p) => p.map((x, idx) => (idx === i ? v : x)));
  };

  const removePollOption = (i) => {
    setPollOptions((p) => (p.length > 2 ? p.filter((_, idx) => idx !== i) : p));
  };

  const buildContent = () => {
    const safeText = text.trim();
    if (!showPoll || !pollHasEnoughOptions) return safeText;

    const pollText = [
      "Poll:",
      ...pollOptions.filter((option) => option.trim()).map((option, index) => `${index + 1}. ${option.trim()}`),
      `Duration: ${pollDays} day${pollDays > 1 ? "s" : ""}`,
    ].join("\n");

    return safeText ? `${safeText}\n\n${pollText}` : pollText;
  };

  const submitPost = async ({ postAs = "user", clubId = "" } = {}) => {
    if (!canPost) return;

    setIsSubmitting(true);
    try {
      const postImages = media.map((item) => item.url).filter(Boolean).slice(0, MAX_MEDIA);
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: buildContent(),
          audience,
          images: postImages,
          authorName: session?.user?.name,
          authorImage: session?.user?.image,
          authorEmail: session?.user?.email,
          postAs,
          clubId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Post failed");

      onPosted?.(data.post);
      close();
    } catch (error) {
      console.error(error);
      alert("Could not publish post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!canPost) return;

    if (leadershipClubs.length === 0) {
      await submitPost({ postAs: "user" });
      return;
    }

    setShowPostAsDrawer(true);
  };

  const ringDeg = Math.min(360, ((MAX_CHARS - Math.max(remaining, 0)) / MAX_CHARS) * 360);
  const ringColor = remaining < 0 ? "#ef4444" : remaining <= 20 ? "#f59e0b" : "#111111";

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
                          className={`relative ${media.length === 3 && i === 0 ? "row-span-2" : ""}`}
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
                                onChange={(e) => updatePollOption(i, e.target.value)}
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
                            onChange={(e) => setPollDays(Number(e.target.value))}
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
            <div className="relative flex items-center justify-between gap-3 border-t border-black/5 bg-white px-5 py-3">
              {showGifPicker && (
                <div className="absolute bottom-14 left-16 z-10 w-72 rounded-2xl border border-black/10 bg-white p-2 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
                  <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-black/50">
                    Trending
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {GIFS.map((g) => (
                      <button
                        key={g}
                        onClick={() => addGif(g)}
                        className="overflow-hidden rounded-lg ring-1 ring-black/10 transition hover:ring-black"
                      >
                        <img src={g} alt="gif" className="h-24 w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showEmojiPicker && (
                <div className="absolute bottom-14 left-36 z-10 w-72 rounded-2xl border border-black/10 bg-white p-3 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
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
                </div>
              )}

              <div className="flex items-center gap-0.5">
                {/* Image */}
                <ToolbarBtn
                  label="Image"
                  disabled={media.length >= MAX_MEDIA || showPoll || isUploading}
                  onClick={() => fileRef.current?.click()}
                >
                  <ImageIcon className="h-[18px] w-[18px]" />
                </ToolbarBtn>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => {
                    onFiles(e.target.files);
                    e.target.value = "";
                  }}
                />

                {/* GIF */}
                <button
                  disabled={media.length >= MAX_MEDIA || showPoll}
                  onClick={() => {
                    setShowGifPicker((value) => !value);
                    setShowEmojiPicker(false);
                  }}
                  className="grid h-9 w-9 place-items-center rounded-full text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="GIF"
                >
                  <span className="text-[11px] font-extrabold tracking-tight">GIF</span>
                </button>

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
                <button
                  className="grid h-9 w-9 place-items-center rounded-full text-black transition hover:bg-black/5"
                  aria-label="Emoji"
                  onClick={() => {
                    setShowEmojiPicker((value) => !value);
                    setShowGifPicker(false);
                  }}
                >
                  <Smile className="h-[18px] w-[18px]" />
                </button>
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

                <button
                  disabled={!canPost}
                  onClick={handleSubmit}
                  className="h-9 rounded-full bg-black px-5 text-sm font-bold text-white shadow-sm transition hover:bg-black/85 disabled:bg-black/30 disabled:text-white"
                >
                  {isUploading ? "Uploading..." : isSubmitting ? "Posting..." : "Post"}
                </button>
              </div>
            </div>

            {showPostAsDrawer && (
              <div className="absolute inset-0 z-20 flex items-end justify-center bg-black/30" onClick={() => setShowPostAsDrawer(false)}>
                <div className="w-full rounded-t-3xl bg-white p-5 shadow-[0_-20px_50px_rgba(0,0,0,0.18)]" onClick={(event) => event.stopPropagation()}>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-black/40">Post as</h3>
                  <button
                    type="button"
                    className="mb-2 flex w-full rounded-2xl border border-black/10 px-4 py-3 text-left transition hover:bg-black/5"
                    onClick={() => submitPost({ postAs: "user" })}
                  >
                    <div>
                      <strong>{session?.user?.name || "User"}</strong>
                      <p className="text-sm text-black/50">Post as your personal profile</p>
                    </div>
                  </button>
                  {leadershipClubs.map((club) => (
                    <button
                      key={club._id}
                      type="button"
                      className="mb-2 flex w-full rounded-2xl border border-black/10 px-4 py-3 text-left transition hover:bg-black/5"
                      onClick={() => submitPost({ postAs: "club", clubId: club._id })}
                    >
                      <div>
                        <strong>{club.clubName || "Club"}</strong>
                        <p className="text-sm text-black/50">Post as club</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ToolbarBtn({ children, onClick, disabled, active, label }) {
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

export default PostFab;
