import { useEffect, useState } from "react";
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Share2, X } from "lucide-react";
import PostMediaGrid from "./PostMediaGrid";
import "./PostsModal.css";


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

const getInitials = (name = "") =>
    name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

function PostCard({ post }) {
    return (
        <article className="pm-card">
            <div className="pm-card-head">
                <div className="pm-card-user">
                    <div className="pm-avatar">
                        {getInitials(post.authorName)}
                    </div>

                    <div className="pm-user-meta">
                        <span className="pm-user-name">
                            {post.authorName}
                        </span>

                        <span className="pm-user-time">
                            {formatRelativeTime(post.createdAt)}
                        </span>
                    </div>
                </div>

                <button type="button" className="pm-more">
                    <MoreHorizontal size={16} />
                </button>
            </div>

            {post.content && (
                <p className="pm-card-text">{post.content}</p>
            )}

            {!!post.images?.length && (
                <div className="pm-card-image">
                    <PostMediaGrid images={post.images} altPrefix="Post media" />
                </div>
            )}

            <div className="pm-card-actions">
                <button type="button" className="pm-action">
                    <Heart size={18} />
                    <span>{post.likeCount || 0}</span>
                </button>

                <button type="button" className="pm-action">
                    <MessageCircle size={18} />
                    <span>{post.commentCount || 0}</span>
                </button>

                <button type="button" className="pm-action">
                    <Share2 size={18} />
                </button>

                <button type="button" className="pm-action pm-action-spacer">
                    <Bookmark size={18} />
                </button>
            </div>
        </article>
    );
}

export function PostsModal({ open, onClose, onOpenChange, mode = "posts", posts: externalPosts, title: externalTitle }) {
    const heading = externalTitle || (mode === "saved" ? "Saved" : "Posts");
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const subtitle = mode === "saved" ? "Posts you've bookmarked" : "Everything you've shared";


    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === "Escape") handleClose();
        };
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose, onOpenChange]);

    // Close handler supporting onOpenChange or onClose
    const handleClose = () => {
        if (typeof onOpenChange === 'function') {
            onOpenChange(false);
        } else if (typeof onClose === 'function') {
            onClose();
        }
    };

    useEffect(() => {
        if (!open) return;
        // If externalPosts prop is provided, use it directly
        if (Array.isArray(externalPosts)) {
            setPosts(externalPosts);
            setLoading(false);
            return;
        }
        // Otherwise fetch user's posts as before
        const fetchPosts = async () => {
            try {
                setLoading(true);
                const res = await fetch("/api/posts/user");
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed");
                setPosts(
                    mode === "saved"
                        ? data.savedPosts || []
                        : data.posts || []
                );
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, [open, mode, externalPosts]);

    if (!open) return null;

    return (
        <div className="pm-overlay" onClick={handleClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-label={heading}
                className="pm-dialog"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="pm-header">
                    <button type="button" className="pm-close" onClick={handleClose} aria-label="Close">
                        <X size={16} />
                    </button>
                    <div className="pm-title-row">
                        <h2 className="pm-title">{heading}</h2>
                        <span className="pm-count">{posts.length}</span>
                    </div>
                    <p className="pm-subtitle">{subtitle}</p>
                </div>

                <div className="pm-scroll">
                    {loading ? (
                        <div className="pm-empty">
                            <p>Loading...</p>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="pm-empty">
                            <div className="pm-empty-icon">
                                <Bookmark size={20} />
                            </div>

                            <p>Nothing here yet.</p>
                        </div>
                    ) : (
                        posts.map((p) => (
                            <PostCard
                                key={p._id}
                                post={p}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
