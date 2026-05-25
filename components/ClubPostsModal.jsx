"use client";

import { useEffect, useMemo, useState } from "react";
import { EllipsisVertical, X } from "lucide-react";
import ReliableImage from "@/components/ReliableImage";
import CommentModal from "@/components/CommentModal";
import ShareModal from "@/components/ShareModal";
import { ReportPostModal } from "@/components/ReportPostModal";

const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
};

const buildAvatarFallback = (name) => {
  const safeName = (name || "UniLynk User").trim() || "UniLynk User";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=random&color=fff&size=128&bold=true`;
};

export function PostsModal({ open, onOpenChange, clubName, clubLogo, clubId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activePostId, setActivePostId] = useState(null);
  const [sharePost, setSharePost] = useState(null);
  const [openShare, setOpenShare] = useState(false);
  const [menuPostId, setMenuPostId] = useState(null);
  const [reportPostId, setReportPostId] = useState(null);

  const fetchPosts = async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/posts?clubId=${clubId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch club posts");
      setPosts(Array.isArray(data?.posts) ? data.posts : []);
    } catch (error) {
      console.error("CLUB POSTS FETCH ERROR:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    fetchPosts();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange, clubId]);

  const getImageGridClass = (count) => {
    if (count <= 1) return "image-grid count-1";
    if (count === 2) return "image-grid count-2";
    if (count === 3) return "image-grid count-3";
    return "image-grid count-4";
  };

  const queueLikeToggle = async (post) => {
    if (!post?.id) return;
    const currentlyLiked = Boolean(post.likedByCurrentUser);
    setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, likedByCurrentUser: !currentlyLiked, likeCount: Math.max(0, Number(p.likeCount || 0) + (!currentlyLiked ? 1 : -1)), likePending: true } : p));

    try {
      const method = currentlyLiked ? "DELETE" : "POST";
      const res = await fetch(`/api/posts/${post.id}/like`, { method });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update like");
      setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, likedByCurrentUser: Boolean(data.likedByCurrentUser), likeCount: Number(data.likeCount || 0), likePending: false } : p));
    } catch (error) {
      console.error(error);
      setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, likedByCurrentUser: currentlyLiked, likeCount: Math.max(0, Number(p.likeCount || 0) + (currentlyLiked ? 1 : -1)), likePending: false } : p));
    }
  };

  const handleCommentSubmit = async (postId, payload) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to add comment");

      setPosts((prev) => prev.map((p) => (p.id === postId ? data.post : p)));
      setActivePostId(null);
    } catch (error) {
      console.error(error);
      alert("Could not publish comment");
    }
  };

  const activePost = useMemo(() => posts.find((p) => p.id === activePostId) || null, [posts, activePostId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={() => onOpenChange(false)} className="absolute inset-0 bg-black/50 backdrop-blur-md animate-in fade-in duration-200" />

      <div className="relative w-full max-w-2xl bg-white border border-black/[0.08] rounded-[28px] overflow-hidden shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_40px_120px_-20px_rgba(0,0,0,0.45),0_8px_24px_-8px_rgba(0,0,0,0.15)]">
        <div className="relative px-6 pt-6 pb-5 bg-gradient-to-b from-white to-[#fafafa] border-b border-black/[0.06]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-[#f3f3f3] overflow-hidden flex items-center justify-center">
                <img src={clubLogo || "/Defaultclublogo.svg"} alt={`${clubName} logo`} className="h-full w-full object-cover" />
              </div>
              <h2 className="tracking-tight text-black leading-tight">{clubName}</h2>
            </div>
            <button onClick={() => onOpenChange(false)} className="size-8 inline-flex items-center justify-center rounded-full text-black/50 hover:text-black hover:bg-black/[0.06]" aria-label="Close">
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4 bg-[#f6f6f6]">
          {loading && <p className="text-center text-black/50 py-6">Loading posts...</p>}
          {!loading && posts.length === 0 && <p className="text-center text-black/50 py-6">No posts yet from this club.</p>}

          {!loading && posts.map((post) => (
            <div className={`userpost mb-3 ${menuPostId === post.id ? "menu-open" : ""}`} key={post.id}>
              <div className="post-left">
                <div className="profilepic">
                  <ReliableImage className="profileimg" src={post.authorImage} alt={post.authorName || "User"} fallbackSrc={buildAvatarFallback(post.authorName)} maxRetries={3} />
                </div>
              </div>
              <div className="post-right">
                <div className="posth">
                  <div className="posth-left">
                    <div className="user-name">{post.authorName || "UniLynk User"}{post.postAs === "club" && <span className="club-verified-tick">✓</span>}</div>
                    <div className="post-time"><span className="post-dot"><svg width="8" height="8" viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg"><circle cx="4" cy="4" r="1.5" fill="grey" /></svg></span><div className="post-timeli">{formatRelativeTime(post.createdAt)}</div></div>
                  </div>
                  <div className="posth-right">
                    <button className='posth-right-btn' onClick={() => setMenuPostId(menuPostId === post.id ? null : post.id)} aria-label="Post options" type="button"><EllipsisVertical /></button>
                  </div>
                </div>

                <div className="post-content">
                  {post.content}
                  {!!post.images?.length && <div className="image-post"><div className={getImageGridClass(post.images.length)}>{post.images.map((imageUrl, idx) => (<img key={`${post.id}-${idx}`} src={imageUrl} alt="Post image" />))}</div></div>}
                </div>

                <div className="post-foot">
                  <div className="post-foot-iconcont">
                    <button onClick={() => queueLikeToggle(post)} disabled={Boolean(post.likePending)} aria-label={post.likedByCurrentUser ? "Unlike post" : "Like post"} className={`like-button ${post.likedByCurrentUser ? "liked" : ""}`} type="button"><img className='post-foot-icon' src="Postimg/thumb.svg" alt="Like" /></button>
                    <span className='post-like-count'>{Number(post.likeCount || 0)}</span>
                  </div>
                  <div className="post-foot-iconcont">
                    <button onClick={() => setActivePostId(post.id)} type="button"><img className='post-foot-icon' src="Postimg/comment.svg" alt="Comment" /></button>
                    <span className='post-comment-count'>{Number(post.commentCount || 0)}</span>
                  </div>
                  <div className="post-foot-iconcont">
                    <button onClick={() => { setSharePost(post); setOpenShare(true); }} type="button"><img className="post-foot-icon" src="Postimg/share.svg" alt="Share" /></button>
                    <span className='post-share-count'>0</span>
                  </div>
                  <div className="post-foot-iconcont"><img className='post-foot-icon' src="Postimg/bookmark.svg" alt="bookmark" /><span className='post-bookmark-count'>0</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CommentModal isOpen={Boolean(activePost)} onClose={() => setActivePostId(null)} onSubmit={(payload) => activePost && handleCommentSubmit(activePost.id, payload)} />
      <ShareModal isOpen={openShare && Boolean(sharePost)} onClose={() => { setOpenShare(false); setSharePost(null); }} post={sharePost} />
      <ReportPostModal isOpen={Boolean(reportPostId)} onClose={() => setReportPostId(null)} postId={reportPostId} />
    </div>
  );
}
