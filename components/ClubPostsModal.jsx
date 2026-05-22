import { useEffect } from "react";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, X, Sparkles } from "lucide-react";

export function PostsModal({ open, onOpenChange, clubName, posts }) {
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              <div className="size-10 rounded-xl bg-black flex items-center justify-center text-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)]">
                <Sparkles className="size-4" />
              </div>
              <div>
                <h2 className="tracking-tight text-black leading-tight">{clubName}</h2>
              </div>
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
            {posts.map((post, idx) => (
              <article
                key={`${post.id}-${idx}`}
                className="group relative py-4 first:pt-2 last:pb-2"
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="size-9 rounded-full overflow-hidden bg-black text-white flex items-center justify-center ring-2 ring-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.25)]">
                      {post.avatar ? (
                        <img src={post.avatar} alt={post.author} className="size-full object-cover" />
                      ) : (
                        <span className="tracking-tight">{post.author.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-baseline gap-1.5 min-w-0">
                        <span className="text-black truncate tracking-tight">{post.author}</span>
                        <span className="text-black/35 truncate">· {post.role}</span>
                      </div>
                      <button className="size-7 inline-flex items-center justify-center rounded-full text-black/40 hover:text-black hover:bg-black/[0.06] transition opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="size-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-black/35 mt-0.5">
                      <span>{post.timeAgo}</span>
                      <span className="size-0.5 rounded-full bg-black/25" />
                      <span className="uppercase tracking-[0.08em]">{post.category}</span>
                    </div>

                    <div className="mt-2.5">
                      <h3 className="text-black tracking-tight leading-snug">{post.title}</h3>
                      <p className="text-black/65 mt-1 leading-relaxed line-clamp-3">{post.content}</p>
                    </div>

                    {post.image && (
                      <div className="mt-3 rounded-2xl overflow-hidden bg-black/[0.04] ring-1 ring-black/[0.06]">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-0.5 mt-3 -ml-2">
                      <button className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-full text-black/55 hover:text-black hover:bg-black/[0.05] transition">
                        <Heart className="size-3.5" />
                        <span>{post.likes}</span>
                      </button>
                      <button className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-full text-black/55 hover:text-black hover:bg-black/[0.05] transition">
                        <MessageCircle className="size-3.5" />
                        <span>{post.comments}</span>
                      </button>
                      <button className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-full text-black/55 hover:text-black hover:bg-black/[0.05] transition">
                        <Share2 className="size-3.5" />
                      </button>
                      <button className="ml-auto size-8 inline-flex items-center justify-center rounded-full text-black/55 hover:text-black hover:bg-black/[0.05] transition">
                        <Bookmark className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {idx < posts.length - 1 && (
                  <div className="absolute left-14 right-0 -bottom-px h-px bg-gradient-to-r from-black/[0.08] via-black/[0.05] to-transparent" />
                )}
              </article>
            ))}
          </div>
        </div>

        <div className="relative px-6 py-3.5 border-t border-black/[0.06] bg-gradient-to-t from-[#fafafa] to-white flex items-center justify-between gap-3">
          <span className="text-black/45 truncate">Stay up to date</span>
        </div>
      </div>
    </div>
  );
}
