"use client";

import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import { Bookmark, EllipsisVertical, Heart, MessageCircle, MoreHorizontal, Share2 } from "lucide-react";
import ReliableImage from "@/components/ReliableImage";

/**
 * Shared post presentation. Network/state concerns intentionally stay with the
 * consuming page so every feed keeps its existing cache and optimistic updates.
 */
export function PostCard({
  post,
  variant = "dashboard",
  isThread = false,
  menuOpen = false,
  menuClosing = false,
  postRef,
  formatTime,
  imageGridClass,
  avatarFallback,
  formatHandle,
  onOpenPost,
  onOpenAuthor,
  onToggleMenu,
  onReport,
  onDelete,
  canDelete = false,
  onLike,
  onComment,
  onShare,
  onSave,
  pollContent,
  compactBusy = false,
  onCompactPostChange,
  onPostChange,
}) {
  const dashboard = true;
  const [localMenuOpen, setLocalMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  if (variant === "compact") return <CompactPostCard post={post} busy={compactBusy} onOpenPost={onOpenPost} onPostChange={onCompactPostChange || onPostChange} />;
  const stop = (event) => event.stopPropagation();
  const openPost = () => !isThread && onOpenPost?.(post.id);
  const updatePost = onCompactPostChange || onPostChange;
  const fallbackUpdate = async (endpoint, optimistic, method = "POST") => {
    if (busy || !post.id || !updatePost) return;
    setBusy(true);
    updatePost({ ...post, ...optimistic });
    try {
      const response = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId: post.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Could not update post");
      updatePost({ ...post, ...optimistic, likeCount: data.likeCount ?? optimistic.likeCount, likedByCurrentUser: data.likedByCurrentUser ?? optimistic.likedByCurrentUser, bookmarkCount: data.bookmarkCount ?? optimistic.bookmarkCount, savedByCurrentUser: data.saved ?? optimistic.savedByCurrentUser });
    } catch { updatePost(post); } finally { setBusy(false); }
  };
  const toggleLike = () => onLike?.(post.id) ?? fallbackUpdate(`/api/posts/${post.id}/like`, { likedByCurrentUser: !post.likedByCurrentUser, likeCount: Math.max(0, Number(post.likeCount || 0) + (post.likedByCurrentUser ? -1 : 1)) }, post.likedByCurrentUser ? "DELETE" : "POST");
  const toggleSave = () => onSave?.(post.id) ?? fallbackUpdate("/api/posts/bookmark", { savedByCurrentUser: !post.savedByCurrentUser, bookmarkCount: Math.max(0, Number(post.bookmarkCount || 0) + (post.savedByCurrentUser ? -1 : 1)) });
  const isMenuOpen = menuOpen || localMenuOpen;
  const openLightbox = (images, index) => setLightbox({ images, index });

  return (
    <>
    <div
      className={`userpost ${isMenuOpen ? "menu-open" : ""} ${isThread ? "thread-root-post" : ""}`}
      ref={postRef}
      onClick={openPost}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPost();
        }
      }}
    >
      <div className="post-left">
        {dashboard ? (
          <button className="profilepic profile-link" type="button" disabled={!post.authorId} onClick={(event) => onOpenAuthor?.(event, post)} aria-label={`Open ${post.authorName || "author"} profile`}>
            <ReliableImage className="profileimg" src={post.authorImage} alt={post.authorName || "User"} fallbackSrc={avatarFallback?.(post.authorName)} maxRetries={3} />
          </button>
        ) : <div className="profilepic"><ReliableImage className="profileimg" src={post.authorImage} alt={post.authorName || "User"} fallbackSrc={avatarFallback?.(post.authorName)} maxRetries={3} /></div>}
      </div>

      <div className="post-right">
        <div className="posth">
          <div className="posth-left">
            {dashboard ? (
              <button className="post-author-link" type="button" disabled={!post.authorId} onClick={(event) => onOpenAuthor?.(event, post)}>
                <span className="user-name">{post.authorName || "UniLynk User"}{post.postAs === "club" && <Icon icon="heroicons-solid:badge-check" color="#1d9bf0" width={18} />}</span>
                {post.postAs !== "club" && post.authorEmail && <span className="post-author-email">{formatHandle?.(post.authorEmail) || `@${post.authorEmail.split("@")[0]}`}</span>}
              </button>
            ) : <div className="user-name">{post.authorName || "UniLynk User"}{post.postAs === "club" && <Icon icon="heroicons-solid:badge-check" color="#1d9bf0" width={18} />}</div>}
            <div className="dd-post-time"><span className="post-dot"><svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="1.5" fill="grey" /></svg></span><div className="post-timeli">{formatTime?.(post.createdAt)}</div></div>
          </div>
          <div className="posth-right">
            <button className="posth-right-btn" onClick={(event) => { stop(event); onToggleMenu ? onToggleMenu(post) : setLocalMenuOpen((open) => !open); }} aria-label="Post options" type="button"><EllipsisVertical /></button>
            {isMenuOpen && <div className={`post-dropdown-menu ${menuClosing ? "closing" : ""}`} onClick={stop}>
              <button className="menu-item" onClick={() => onReport?.(post.id)}>Report Post</button>
              {canDelete && <button className="menu-item menu-item-danger" type="button" onClick={() => onDelete?.(post)}>Delete post</button>}
              <button className="menu-item" type="button" onClick={toggleSave}>{post.savedByCurrentUser ? "Unsave Post" : "Save Post"}</button>
              <button className="menu-item" onClick={() => onShare ? onShare(post) : navigator.share?.({ title: post.authorName, text: post.content, url: window.location.href })}>Share</button>
            </div>}
          </div>
        </div>

        <div className="post-content">
          {post.content}
          {!!post.images?.length && <div className="image-post">{post.images.length === 1 ? <div className="x-single-image"><PostMedia src={post.images[0]} onClick={(event) => { stop(event); openLightbox(post.images, 0); }} /></div> : <div className={imageGridClass?.(post.images.length)}>{post.images.map((image, index) => <PostMedia key={`${post.id}-${index}`} src={image} onClick={(event) => { stop(event); openLightbox(post.images, index); }} />)}</div>}</div>}
          {pollContent}
        </div>

        <div className="post-foot" onClick={stop}>
          <FeedAction className={`like-button ${post.likedByCurrentUser ? "liked" : ""}`} countClass="post-like-count" onClick={toggleLike} disabled={Boolean(post.likePending) || busy} icon={dashboard ? <HeartLike liked={post.likedByCurrentUser} /> : <img className="post-foot-icon" src="/Postimg/thumb.svg" alt="Like" />} count={post.likeCount} />
          <FeedAction countClass="post-comment-count" onClick={() => onComment?.(post.id)} icon={<img className="post-foot-icon" src="/Postimg/comment.svg" alt="Comment" />} count={post.commentCount} />
          <FeedAction countClass="post-share-count" onClick={() => onShare ? onShare(post) : navigator.share?.({ title: post.authorName, text: post.content, url: window.location.href })} icon={<img className="post-foot-icon" src="/Postimg/share.svg" alt="Share" />} count={0} />
          <FeedAction countClass="post-bookmark-count" onClick={toggleSave} disabled={busy} icon={dashboard ? <BookmarkIcon saved={post.savedByCurrentUser} /> : <img className="post-foot-icon" src="/Postimg/bookmark.svg" alt="bookmark" style={{ opacity: post.savedByCurrentUser ? 1 : 0.6 }} />} count={post.bookmarkCount} />
        </div>
      </div>
    </div>
    {lightbox && <PostLightbox images={lightbox.images} initialIndex={lightbox.index} onClose={() => setLightbox(null)} />}
    </>
  );
}

function FeedAction({ onClick, icon, count, countClass, ...buttonProps }) { return <div className="post-foot-iconcont"><button type="button" onClick={onClick} {...buttonProps}>{icon}</button><span className={countClass}>{Number(count || 0)}</span></div>; }
function HeartLike({ liked }) { return <svg className={`post-foot-icon ${liked ? "liked-heart" : ""}`} viewBox="0 0 256 256" width="22" height="22"><path fill={liked ? "#EC4899" : "none"} stroke={liked ? "#EC4899" : "#3e3e3e"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" d="M128,216S28,160,28,92A52.00881,52.00881,0,0,1,128.00008,71.965l-.00019.00008A52.00881,52.00881,0,0,1,228,92C228,160,128,216,128,216Z" /></svg>; }
function BookmarkIcon({ saved }) { return <svg className="post-foot-icon" width="128" height="128" viewBox="0 0 128 128" fill={saved ? "#dbdbdb" : "none"}><path stroke="#3e3e3e" strokeWidth="7" d="M78.978 20.8778C89.5889 23.625 96.9999 33.1992 96.9998 44.16L96.9995 67.8624L96.9997 88.1536C96.9999 100.313 96.9999 106.392 93.1442 108.331C89.2885 110.269 84.4088 106.643 74.6493 99.3908L72.3504 97.6824C68.3276 94.693 66.3161 93.1982 64 93.1982C61.6838 93.1983 59.6724 94.693 55.6495 97.6824L53.3505 99.3909C43.5911 106.643 38.7114 110.27 34.8557 108.331C31 106.393 31 100.313 31 88.1539L31 67.8624L31 44.1599C31 33.1992 38.4111 23.625 49.022 20.8778C58.8454 18.3345 69.1546 18.3345 78.978 20.8778Z" /></svg>; }

const isVideo = (source = "") => /\.(mp4|webm|ogg|mov)(?:[?#]|$)/i.test(source);
function PostMedia({ src, onClick, className = "" }) {
  return isVideo(src) ? <video className={className} src={src} muted playsInline preload="metadata" onClick={onClick} style={{ cursor: "pointer" }} /> : <img className={className} src={src} alt="" loading="lazy" style={{ cursor: "pointer" }} onClick={onClick} />;
}

function PostLightbox({ images, initialIndex, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isVisible, setIsVisible] = useState(false);
  const touchStartRef = useRef(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    document.body.style.overflow = "hidden";
    return () => { cancelAnimationFrame(frame); document.body.style.overflow = ""; };
  }, []);

  const close = () => { setIsVisible(false); setTimeout(onClose, 220); };
  const goTo = (index) => setCurrentIndex((index + images.length) % images.length);
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft" && images.length > 1) goTo(currentIndex - 1);
      if (event.key === "ArrowRight" && images.length > 1) goTo(currentIndex + 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIndex, images.length]);

  const currentMedia = images[currentIndex];
  return <div className={`lightbox-overlay ${isVisible ? "lightbox-visible" : ""}`} onClick={close}>
    <button className="lightbox-close" onClick={close} type="button" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
    {images.length > 1 && <div className="lightbox-counter">{currentIndex + 1} / {images.length}</div>}
    <div className="lightbox-content" onClick={(event) => event.stopPropagation()} onTouchStart={(event) => { touchStartRef.current = event.touches[0].clientX; }} onTouchEnd={(event) => { if (touchStartRef.current === null) return; const difference = touchStartRef.current - event.changedTouches[0].clientX; if (Math.abs(difference) > 40 && images.length > 1) goTo(difference > 0 ? currentIndex + 1 : currentIndex - 1); touchStartRef.current = null; }}>
      {isVideo(currentMedia) ? <video key={currentMedia} className="lightbox-img" src={currentMedia} controls autoPlay playsInline /> : <img key={currentMedia} className="lightbox-img" src={currentMedia} alt="" draggable={false} />}
    </div>
    {images.length > 1 && <><button className="lightbox-nav lightbox-nav-left" onClick={(event) => { event.stopPropagation(); goTo(currentIndex - 1); }} type="button" aria-label="Previous media"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg></button><button className="lightbox-nav lightbox-nav-right" onClick={(event) => { event.stopPropagation(); goTo(currentIndex + 1); }} type="button" aria-label="Next media"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg></button></>}
    {images.length > 1 && <div className="lightbox-thumbs" onClick={(event) => event.stopPropagation()}>{images.map((media, index) => <button key={media} className={`lightbox-thumb-btn ${index === currentIndex ? "lightbox-thumb-active" : ""}`} onClick={() => setCurrentIndex(index)} type="button" aria-label={`View media ${index + 1}`}>{isVideo(media) ? <video src={media} muted playsInline /> : <img src={media} alt="" draggable={false} />}</button>)}</div>}
  </div>;
}

function CompactPostCard({ post, busy: externallyBusy, onOpenPost, onPostChange }) {
  const [busy, setBusy] = useState(false);
  const isBusy = externallyBusy || busy;
  const toggle = async (endpoint, optimistic, method = "POST") => { if (isBusy || !post.id) return; setBusy(true); const previous = post; onPostChange?.({ ...post, ...optimistic }); try { const response = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId: post.id }) }); const data = await response.json(); if (!response.ok) throw new Error(); onPostChange?.({ ...post, ...optimistic, ...data, savedByCurrentUser: data.saved ?? optimistic.savedByCurrentUser }); } catch { onPostChange?.(previous); } finally { setBusy(false); } };
  return <div className="overflow-hidden rounded-2xl border border-[#0000001A] bg-[#fff] shadow-sm"><div className="flex items-center gap-3 p-4"><div className="size-10 shrink-0 overflow-hidden rounded-full"><ReliableImage src={post.authorImage} fallbackSrc="/Profilepic.png" alt={post.authorName} className="size-full object-cover" /></div><div className="flex-1"><div className="text-[#0a0a0a]">{post.authorName}</div><div className="text-sm text-[#717182]">{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ""}</div></div><button className="text-[#717182] transition-colors hover:text-[#0a0a0a]"><MoreHorizontal className="size-5" /></button></div>{post.content && <p className="px-4 pb-3 text-sm text-[#0a0a0a]">{post.content}</p>}{!!post.images?.length && <div className="aspect-[4/3] w-full overflow-hidden bg-[#ececf0]"><ReliableImage src={post.images[0]} fallbackSrc="/Profilepic.png" alt={post.content || "Post image"} className="size-full object-cover" /></div>}<div className="flex items-center gap-6 px-4 py-3 text-sm text-[#717182]"><button disabled={isBusy} onClick={() => toggle(`/api/posts/${post.id}/like`, { likedByCurrentUser: !post.likedByCurrentUser, likeCount: Math.max(0, Number(post.likeCount || 0) + (post.likedByCurrentUser ? -1 : 1)) }, post.likedByCurrentUser ? "DELETE" : "POST")} className={`flex items-center gap-1.5 transition-colors hover:text-rose-500 ${post.likedByCurrentUser ? "text-rose-500" : ""}`}><Heart className="size-4" fill={post.likedByCurrentUser ? "currentColor" : "none"} /> {post.likeCount || 0}</button><button onClick={() => onOpenPost?.(post.id)} className="flex items-center gap-1.5 transition-colors hover:text-[#0a0a0a]"><MessageCircle className="size-4" /> {post.commentCount || 0}</button><button onClick={() => navigator.share?.({ title: post.authorName, text: post.content, url: window.location.href })} className="flex items-center gap-1.5 transition-colors hover:text-[#0a0a0a]"><Share2 className="size-4" /></button><button disabled={isBusy} onClick={() => toggle("/api/posts/bookmark", { savedByCurrentUser: !post.savedByCurrentUser, bookmarkCount: Math.max(0, Number(post.bookmarkCount || 0) + (post.savedByCurrentUser ? -1 : 1)) })} className="ml-auto transition-colors hover:text-[#0a0a0a]"><Bookmark className="size-4" fill={post.savedByCurrentUser ? "currentColor" : "none"} /></button></div></div>;
}
