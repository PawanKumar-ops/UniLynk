import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, X } from "lucide-react";
import { Icon } from "@iconify/react";

const formatRelativeTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "just now";
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
};

export function PostsModal({ open, onOpenChange, clubName, clubLogo, posts, title = "Club Posts" }) {
  const [localPosts, setLocalPosts] = useState([]);
  const [mounted, setMounted] = useState(false);
  const normalizedPosts = useMemo(() => (Array.isArray(posts) ? posts : []), [posts]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLocalPosts(normalizedPosts);
  }, [normalizedPosts]);

  useEffect(() => {
    if (!open) return;
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
  }, [open, onOpenChange]);

  if (!open || !mounted) return null;

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <style>{`
        .premium-scroll::-webkit-scrollbar { width: 6px; }
        .premium-scroll::-webkit-scrollbar-track { background: transparent; }
        .premium-scroll::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.12);
          border-radius: 9999px;
          transition: background .2s;
        }
        .premium-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.28); }
        .premium-scroll { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.18) transparent; }
      `}</style>

      <div
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 bg-black/50 backdrop-blur-md animate-in fade-in duration-200"
      />

      <div className="relative w-full max-w-md bg-white border border-black/[0.08] rounded-[28px] overflow-hidden shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_40px_120px_-20px_rgba(0,0,0,0.45),0_8px_24px_-8px_rgba(0,0,0,0.15)] animate-in zoom-in-95 fade-in slide-in-from-bottom-2 duration-300">
        <div className="relative px-6 pt-6 pb-5 bg-gradient-to-b from-white to-[#fafafa] border-b border-black/[0.06]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">{title}</h2>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="size-8 inline-flex items-center justify-center rounded-full text-black/50 hover:text-black hover:bg-black/[0.06] transition-all"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="premium-scroll max-h-[65vh] overflow-y-auto">
          <div className="px-6 py-4 space-y-1">
            {localPosts.length === 0 && (
              <div className="py-14 text-center text-black/45">
                No posts to show yet.
              </div>
            )}
            {localPosts.map((post, idx) => {
              const postId = post.id || post._id;
              const authorName = clubName || post.authorName || "UniLynk";
              const authorImage = clubLogo || post.authorImage || "";
              const initials = authorName.slice(0, 2).toUpperCase();

              return (
              <article
                key={`${postId || idx}-${idx}`}
                className="group relative py-4 first:pt-2 last:pb-2"
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="size-9 rounded-full overflow-hidden bg-black text-white flex items-center justify-center ring-2 ring-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.25)]">
                      {authorImage ? (
                        <img src={authorImage} alt={authorName} className="size-full object-cover" />
                      ) : (
                        <span className="tracking-tight">{initials}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-baseline gap-1.5 min-w-0">
                        <span className="text-black truncate tracking-tight inline-flex items-center gap-1">{authorName}<Icon icon="heroicons-solid:badge-check" color='#1d9bf0' width={18} /></span>
                        <span className="text-black/35 truncate text-[14px]">· {formatRelativeTime(post.createdAt)}</span>
                      </div>
                      <button className="size-7 inline-flex items-center justify-center rounded-full text-black/40 hover:text-black hover:bg-black/[0.06] transition opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="size-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-black/35 mt-0.5">
                      <span></span>


                    </div>

                    <div className="mt-2.5">
                      <p className="text-black/65 mt-1 leading-relaxed break-words [overflow-wrap:anywhere]">
                        {post.content}
                      </p>
                    </div>

                    {!!post.images?.length && (
                      <div className="mt-3 rounded-2xl overflow-hidden bg-black/[0.04] ring-1 ring-black/[0.06]">
                        <img
                          src={post.images[0]}
                          alt="Post media"
                          className="w-full h-44 object-cover block"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-0.5 mt-3 -ml-2">
                      <button
                        className={`inline-flex items-center gap-1.5 px-2.5 h-8 rounded-full hover:bg-black/[0.05] transition ${post.likedByCurrentUser ? "text-blue-600" : "text-black/55 hover:text-black"}`}
                        onClick={async () => {
                          const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
                          const data = await res.json();
                          if (!res.ok) return;
                          setLocalPosts((prev) => prev.map((p) => (p.id || p._id) === postId ? { ...p, likedByCurrentUser: Boolean(data.likedByCurrentUser), likeCount: Number(data.likeCount || 0) } : p));
                        }}
                        type="button"
                      >
                        <Heart className="size-3.5" />
                        <span>{Number(post.likeCount || 0)}</span>
                      </button>
                      <button
                        className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-full text-black/55 hover:text-black hover:bg-black/[0.05] transition"
                        onClick={async () => {
                          const text = window.prompt("Write your comment");
                          if (!text?.trim()) return;
                          const res = await fetch(`/api/posts/${postId}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: text.trim(), images: [] }) });
                          const data = await res.json();
                          if (!res.ok) return;
                          setLocalPosts((prev) => prev.map((p) => (p.id || p._id) === postId ? { ...p, commentCount: Number(data?.post?.commentCount || (Number(p.commentCount || 0) + 1)) } : p));
                        }}
                        type="button"
                      >
                        <MessageCircle className="size-3.5" />
                        <span>{Number(post.commentCount || 0)}</span>
                      </button>
                      <button
                        className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-full text-black/55 hover:text-black hover:bg-black/[0.05] transition"
                        onClick={async () => {
                          const postUrl = `${window.location.origin}/dashboard?postId=${postId}`;
                          await navigator.clipboard.writeText(postUrl);
                        }}
                        type="button"
                      >
                        <Share2 className="size-3.5" />
                      </button>
                      <button
                        className={`inline-flex items-center gap-1.5 px-2.5 h-8 rounded-full ${post.savedByCurrentUser ? 'text-blue-600' : 'text-black/55 hover:text-black'} transition`}
                        onClick={async () => {
                          const res = await fetch('/api/users/me/bookmark', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ postId }),
                          });
                          const data = await res.json();
                          if (!res.ok) return;
                          setLocalPosts((prev) =>
                            prev.map((p) =>
                              (p.id || p._id) === postId ? { ...p, savedByCurrentUser: data.saved } : p
                            )
                          );
                        }}
                        type="button"
                      >
                        <Bookmark className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {idx < localPosts.length - 1 && (
                  <div className="absolute left-14 right-0 -bottom-px h-px bg-gradient-to-r from-black/[0.08] via-black/[0.05] to-transparent" />
                )}
              </article>
              );
            })}
          </div>
        </div>

        <div className="relative px-6 py-3.5 border-t border-black/[0.06] bg-gradient-to-t from-[#fafafa] to-white flex items-center justify-between gap-3">
          <span className="text-black/45 truncate">Stay up to date</span>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
