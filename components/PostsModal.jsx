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

const getPostId = (post) => post?.id || post?._id;

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
    <div className="posts-modal-root" role="dialog" aria-modal="true" aria-label={title}>
      <style>{`
        .posts-modal-root,
        .posts-modal-root * {
          box-sizing: border-box;
        }

        .posts-modal-root {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .posts-modal-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(12px);
        }

        .posts-modal-card {
          position: relative;
          width: min(448px, calc(100vw - 32px));
          max-height: min(760px, calc(100vh - 32px));
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 28px;
          box-shadow: 0 1px 0 rgba(255,255,255,0.6) inset,
            0 40px 120px -20px rgba(0,0,0,0.45),
            0 8px 24px -8px rgba(0,0,0,0.15);
          animation: postsModalIn 180ms ease-out;
        }

        @keyframes postsModalIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .posts-modal-header,
        .posts-modal-footer {
          flex: 0 0 auto;
          padding-left: 24px;
          padding-right: 24px;
          background: linear-gradient(180deg, #ffffff, #fafafa);
        }

        .posts-modal-header {
          padding-top: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .posts-modal-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .posts-modal-title {
          margin: 0;
          min-width: 0;
          color: #000000;
          font-size: 20px;
          line-height: 28px;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        .posts-modal-close {
          width: 32px;
          height: 32px;
          flex: 0 0 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 9999px;
          color: rgba(0, 0, 0, 0.5);
          background: transparent;
          cursor: pointer;
          transition: color 160ms ease, background 160ms ease;
        }

        .posts-modal-close:hover {
          color: #000000;
          background: rgba(0, 0, 0, 0.06);
        }

        .posts-modal-body {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: thin;
          scrollbar-color: rgba(0,0,0,0.18) transparent;
        }

        .posts-modal-body::-webkit-scrollbar { width: 6px; }
        .posts-modal-body::-webkit-scrollbar-track { background: transparent; }
        .posts-modal-body::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.12);
          border-radius: 9999px;
          transition: background .2s;
        }
        .posts-modal-body::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.28); }

        .posts-modal-list {
          padding: 16px 24px;
        }

        .posts-modal-empty {
          padding: 56px 0;
          text-align: center;
          color: rgba(0, 0, 0, 0.45);
        }

        .posts-modal-post {
          position: relative;
          padding: 16px 0;
        }

        .posts-modal-post:first-of-type {
          padding-top: 8px;
        }

        .posts-modal-post:last-of-type {
          padding-bottom: 8px;
        }

        .posts-modal-post-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          min-width: 0;
        }

        .posts-modal-avatar-wrap {
          position: relative;
          width: 36px;
          height: 36px;
          flex: 0 0 36px;
        }

        .posts-modal-avatar {
          width: 36px;
          height: 36px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          background: #000000;
          color: #ffffff;
          box-shadow: 0 2px 8px -2px rgba(0,0,0,0.25);
          outline: 2px solid #ffffff;
        }

        .posts-modal-avatar img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .posts-modal-content {
          flex: 1 1 auto;
          min-width: 0;
          overflow: hidden;
        }

        .posts-modal-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          min-width: 0;
        }

        .posts-modal-author-line {
          min-width: 0;
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .posts-modal-author {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #000000;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: -0.01em;
        }

        .posts-modal-time {
          flex: 0 0 auto;
          color: rgba(0, 0, 0, 0.35);
          font-size: 14px;
          white-space: nowrap;
        }

        .posts-modal-more {
          width: 28px;
          height: 28px;
          flex: 0 0 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 9999px;
          color: rgba(0, 0, 0, 0.4);
          background: transparent;
          cursor: pointer;
          opacity: 0;
          transition: opacity 160ms ease, color 160ms ease, background 160ms ease;
        }

        .posts-modal-post:hover .posts-modal-more {
          opacity: 1;
        }

        .posts-modal-more:hover {
          color: #000000;
          background: rgba(0, 0, 0, 0.06);
        }

        .posts-modal-text {
          margin: 10px 0 0;
          color: rgba(0, 0, 0, 0.65);
          line-height: 1.625;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .posts-modal-media {
          margin-top: 12px;
          overflow: hidden;
          border-radius: 16px;
          background: rgba(0, 0, 0, 0.04);
          box-shadow: 0 0 0 1px rgba(0,0,0,0.06);
        }

        .posts-modal-media img {
          width: 100%;
          height: 176px;
          display: block;
          object-fit: cover;
        }

        .posts-modal-actions {
          display: flex;
          align-items: center;
          gap: 2px;
          margin-top: 12px;
          margin-left: -8px;
        }

        .posts-modal-action {
          min-width: 32px;
          height: 32px;
          padding: 0 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: 0;
          border-radius: 9999px;
          background: transparent;
          color: rgba(0, 0, 0, 0.55);
          cursor: pointer;
          transition: color 160ms ease, background 160ms ease;
        }

        .posts-modal-action:hover {
          color: #000000;
          background: rgba(0, 0, 0, 0.05);
        }

        .posts-modal-action.is-active {
          color: #2563eb;
        }

        .posts-modal-divider {
          position: absolute;
          left: 56px;
          right: 0;
          bottom: -1px;
          height: 1px;
          background: linear-gradient(90deg, rgba(0,0,0,0.08), rgba(0,0,0,0.05), transparent);
        }

        .posts-modal-footer {
          padding-top: 14px;
          padding-bottom: 14px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          background: linear-gradient(0deg, #fafafa, #ffffff);
          color: rgba(0, 0, 0, 0.45);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>

      <div
        onClick={() => onOpenChange(false)}
        className="posts-modal-backdrop"
      />

      <div className="posts-modal-card">
        <div className="posts-modal-header">
          <div className="posts-modal-header-row">
            <h2 className="posts-modal-title">{title}</h2>
            <button
              onClick={() => onOpenChange(false)}
              className="posts-modal-close"
              aria-label="Close"
              type="button"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="posts-modal-body">
          <div className="posts-modal-list">
            {localPosts.length === 0 && (
              <div className="posts-modal-empty">
                No posts to show yet.
              </div>
            )}
            {localPosts.map((post, idx) => {
              const postId = getPostId(post);
              const authorName = clubName || post.authorName || "UniLynk";
              const authorImage = clubLogo || post.authorImage || "";
              const initials = authorName.slice(0, 2).toUpperCase();

              return (
                <article
                  key={`${postId || idx}-${idx}`}
                  className="posts-modal-post"
                >
                  <div className="posts-modal-post-row">
                    <div className="posts-modal-avatar-wrap">
                      <div className="posts-modal-avatar">
                        {authorImage ? (
                          <img src={authorImage} alt={authorName} />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>
                    </div>

                    <div className="posts-modal-content">
                      <div className="posts-modal-meta-row">
                        <div className="posts-modal-author-line">
                          <span className="posts-modal-author">
                            {authorName}
                            <Icon icon="heroicons-solid:badge-check" color="#1d9bf0" width={18} />
                          </span>
                          <span className="posts-modal-time">· {formatRelativeTime(post.createdAt)}</span>
                        </div>
                        <button className="posts-modal-more" type="button" aria-label="More options">
                          <MoreHorizontal size={14} />
                        </button>
                      </div>

                      <p className="posts-modal-text">
                        {post.content}
                      </p>

                      {!!post.images?.length && (
                        <div className="posts-modal-media">
                          <img
                            src={post.images[0]}
                            alt="Post media"
                          />
                        </div>
                      )}

                      <div className="posts-modal-actions">
                        <button
                          className={`posts-modal-action ${post.likedByCurrentUser ? "is-active" : ""}`}
                          onClick={async () => {
                            const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
                            const data = await res.json();
                            if (!res.ok) return;
                            setLocalPosts((prev) => prev.map((p) => getPostId(p) === postId ? { ...p, likedByCurrentUser: Boolean(data.likedByCurrentUser), likeCount: Number(data.likeCount || 0) } : p));
                          }}
                          type="button"
                        >
                          <Heart size={14} />
                          <span>{Number(post.likeCount || 0)}</span>
                        </button>
                        <button
                          className="posts-modal-action"
                          onClick={async () => {
                            const text = window.prompt("Write your comment");
                            if (!text?.trim()) return;
                            const res = await fetch(`/api/posts/${postId}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: text.trim(), images: [] }) });
                            const data = await res.json();
                            if (!res.ok) return;
                            setLocalPosts((prev) => prev.map((p) => getPostId(p) === postId ? { ...p, commentCount: Number(data?.post?.commentCount || (Number(p.commentCount || 0) + 1)) } : p));
                          }}
                          type="button"
                        >
                          <MessageCircle size={14} />
                          <span>{Number(post.commentCount || 0)}</span>
                        </button>
                        <button
                          className="posts-modal-action"
                          onClick={async () => {
                            const postUrl = `${window.location.origin}/dashboard?postId=${postId}`;
                            await navigator.clipboard.writeText(postUrl);
                          }}
                          type="button"
                          aria-label="Copy post link"
                        >
                          <Share2 size={14} />
                        </button>
                        <button
                          className={`posts-modal-action ${post.savedByCurrentUser ? "is-active" : ""}`}
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
                                getPostId(p) === postId ? { ...p, savedByCurrentUser: data.saved } : p
                              )
                            );
                          }}
                          type="button"
                          aria-label="Toggle saved post"
                        >
                          <Bookmark size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {idx < localPosts.length - 1 && (
                    <div className="posts-modal-divider" />
                  )}
                </article>
              );
            })}
          </div>
        </div>

        <div className="posts-modal-footer">
          Stay up to date
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
