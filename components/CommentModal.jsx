"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Smile, Image as ImageIcon, X, Loader2, Search } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Grid } from "@giphy/react-components";

const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || "";
const gf = new GiphyFetch(GIPHY_API_KEY);

const MAX_LENGTH = 1000;
const MAX_TEXTAREA_HEIGHT = 220;

/* Self-contained styles — no external CSS file required. */
const styles = `
.cm-overlay{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(17,17,17,.45);backdrop-filter:blur(2px);animation:cm-fade .15s ease-out}
.cm-dialog{position:relative;display:flex;flex-direction:column;width:100%;max-width:560px;max-height:min(92dvh,720px);background:#fff;border-radius:14px;box-shadow:0 24px 60px -12px rgba(0,0,0,.25);overflow:hidden;animation:cm-rise .18s ease-out;font-family:inherit;color:#1f1f1f}
.cm-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #eee}
.cm-title{margin:0;font-size:17px;font-weight:600;letter-spacing:-.01em}
.cm-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border:0;border-radius:8px;background:transparent;color:#545454;cursor:pointer;transition:background .15s,color .15s}
.cm-icon-btn:hover:not(:disabled){background:#f2f2f2;color:#1f1f1f}
.cm-icon-btn:focus-visible,.cm-btn:focus-visible,.cm-remove:focus-visible{outline:2px solid #1f1f1f;outline-offset:2px}
.cm-icon-btn:disabled{opacity:.45;cursor:not-allowed}
.cm-icon-btn[aria-pressed="true"]{background:#1f1f1f;color:#fff}
.cm-body{flex:1 1 auto;min-height:0;overflow-y:auto;padding:16px 20px}
.cm-textarea{display:block;width:100%;box-sizing:border-box;border:0;outline:0;resize:none;font:inherit;font-size:15px;line-height:1.55;color:inherit;background:transparent;padding:0}
.cm-textarea::placeholder{color:#9a9a9a}
.cm-media{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;margin-top:12px}
.cm-media-card{position:relative;border-radius:10px;overflow:hidden;background:#f4f4f4;aspect-ratio:1}
.cm-media-card.cm-gif{grid-column:span 2;aspect-ratio:auto;max-height:220px}
.cm-media-card img{display:block;width:100%;height:100%;object-fit:cover}
.cm-remove{position:absolute;top:6px;right:6px;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border:0;border-radius:999px;background:rgba(17,17,17,.7);color:#fff;cursor:pointer}
.cm-remove:hover{background:#111}
.cm-tray{flex:0 0 auto;border-top:1px solid #eee;background:#fafafa;height:320px;display:flex;flex-direction:column;animation:cm-tray .18s ease-out}
.cm-tray .EmojiPickerReact{--epr-bg-color:#fafafa;--epr-category-label-bg-color:#fafafa;border:0!important;border-radius:0!important}
.cm-gif-search{position:relative;padding:12px 12px 8px}
.cm-gif-search svg{position:absolute;left:24px;top:50%;transform:translateY(-30%);color:#9a9a9a;pointer-events:none}
.cm-gif-search input{width:100%;box-sizing:border-box;height:38px;padding:0 12px 0 36px;border:1px solid #e3e3e3;border-radius:9px;background:#fff;font:inherit;font-size:14px;outline:0}
.cm-gif-search input:focus{border-color:#1f1f1f}
.cm-gif-grid{flex:1;min-height:0;overflow-y:auto;padding:0 12px 12px}
.cm-gif-empty{padding:24px;text-align:center;font-size:13px;color:#8a8a8a}
.cm-footer{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px 12px 12px;border-top:1px solid #eee}
.cm-tools{display:flex;align-items:center;gap:2px}
.cm-actions{display:flex;align-items:center;gap:10px}
.cm-count{font-size:12px;color:#9a9a9a;font-variant-numeric:tabular-nums}
.cm-count.cm-warn{color:#c2410c}
.cm-btn{height:38px;padding:0 16px;border-radius:9px;font:inherit;font-size:14px;font-weight:500;cursor:pointer;transition:background .15s,opacity .15s}
.cm-btn-ghost{border:1px solid #e3e3e3;background:#fff;color:#1f1f1f}
.cm-btn-ghost:hover{background:#f5f5f5}
.cm-btn-primary{border:1px solid #1f1f1f;background:#1f1f1f;color:#fff}
.cm-btn-primary:hover:not(:disabled){background:#000}
.cm-btn-primary:disabled{opacity:.4;cursor:not-allowed}
.cm-error{margin:0 20px 12px;padding:8px 12px;border-radius:8px;background:#fef2f2;color:#b91c1c;font-size:13px}
.cm-hidden{display:none}
.cm-spin{animation:cm-spin 1s linear infinite}
@media (max-width:540px){
  .cm-overlay{align-items:flex-end;padding:0}
  .cm-dialog{max-width:none;max-height:94dvh;border-radius:16px 16px 0 0;animation:cm-sheet .22s ease-out}
  .cm-tray{height:280px}
  .cm-count{display:none}
  .cm-btn{padding:0 14px}
  .cm-footer{padding-bottom:max(12px,env(safe-area-inset-bottom))}
}
@keyframes cm-fade{from{opacity:0}}
@keyframes cm-rise{from{opacity:0;transform:translateY(8px) scale(.98)}}
@keyframes cm-sheet{from{transform:translateY(100%)}}
@keyframes cm-tray{from{height:0;opacity:0}}
@keyframes cm-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.cm-overlay,.cm-dialog,.cm-tray{animation:none}}
`;

const GifIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.25 9c.41 0 .75.34.75.75v4.5c0 .41-.34.75-.75.75s-.75-.34-.75-.75v-4.5c0-.41.34-.75.75-.75zM10 9.75c0-.41-.34-.75-.75-.75H6c-.6 0-1 .5-1 1v4c0 .5.4 1 1 1h3c.6 0 1-.5 1-1v-1.25c0-.41-.34-.75-.75-.75s-.75.34-.75.75v.75h-2v-3h2.75c.41 0 .75-.34.75-.75zm9 0c0-.41-.34-.75-.75-.75H15.5c-.55 0-1 .45-1 1v4.25c0 .41.34.75.75.75s.75-.34.75-.75V13h1.25c.41 0 .75-.34.75-.75s-.34-.75-.75-.75H16v-1h2.25c.41 0 .75-.34.75-.75z" />
    </svg>
);

function useDebounced(value, delay = 350) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
}

function CommentGifPicker({ onSelect }) {
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounced(query.trim());
    const gridRef = useRef(null);
    const [width, setWidth] = useState(0);

    // Giphy's Grid needs a numeric width — measure the container so it stays responsive.
    useLayoutEffect(() => {
        const el = gridRef.current;
        if (!el) return;
        const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const fetchGifs = useCallback(
        (offset) =>
            debouncedQuery
                ? gf.search(debouncedQuery, { offset, limit: 20 })
                : gf.trending({ offset, limit: 20 }),
        [debouncedQuery]
    );

    return (
        <>
            <div className="cm-gif-search">
                <Search size={16} />
                <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search GIFs"
                    aria-label="Search GIFs"
                    autoFocus
                />
            </div>
            <div className="cm-gif-grid" ref={gridRef}>
                {!GIPHY_API_KEY ? (
                    <p className="cm-gif-empty">GIF search is unavailable.</p>
                ) : (
                    width > 0 && (
                        <Grid
                            key={debouncedQuery}
                            width={width}
                            columns={width < 360 ? 2 : 3}
                            gutter={6}
                            fetchGifs={fetchGifs}
                            noLink
                            hideAttribution
                            onGifClick={(gif, event) => {
                                event.preventDefault();
                                const url =
                                    gif.images.downsized_medium?.url ||
                                    gif.images.original?.url ||
                                    gif.images.fixed_height?.url ||
                                    gif.images.original_mp4?.mp4;
                                if (url) onSelect(url);
                            }}
                        />
                    )
                )}
            </div>
        </>
    );
}

const CommentModal = ({ isOpen, onClose, onSubmit }) => {
    const [comment, setComment] = useState("");
    const [isMounted, setIsMounted] = useState(false);
    const [activePanel, setActivePanel] = useState(null); // "emoji" | "gif" | null
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [imageAttachments, setImageAttachments] = useState([]);
    const [gifAttachment, setGifAttachment] = useState("");

    const titleId = useId();
    const mediaInputRef = useRef(null);
    const textareaRef = useRef(null);
    const dialogRef = useRef(null);
    const caretRef = useRef(null);

    useEffect(() => setIsMounted(true), []);

    // Scroll lock, Escape handling, focus trap, focus restore.
    useEffect(() => {
        if (!isOpen) return;
        const previouslyFocused = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                event.stopPropagation();
                setActivePanel((panel) => {
                    if (panel) return null; // close the tray first
                    onClose?.();
                    return panel;
                });
                return;
            }
            if (event.key !== "Tab" || !dialogRef.current) return;
            const focusable = dialogRef.current.querySelectorAll(
                'button:not([disabled]), textarea, input:not([type="file"]), [tabindex]:not([tabindex="-1"])'
            );
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleKeyDown);
            previouslyFocused?.focus?.();
        };
    }, [isOpen, onClose]);

    // Reset state when closed.
    useEffect(() => {
        if (isOpen) return;
        setComment("");
        setActivePanel(null);
        setUploadingImage(false);
        setUploadError("");
        setImageAttachments([]);
        setGifAttachment("");
    }, [isOpen]);

    // Auto-grow textarea.
    useLayoutEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
        el.style.overflowY = el.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
    }, [comment, isOpen]);

    if (!isOpen || !isMounted) return null;

    const hasMedia = Boolean(imageAttachments.length || gifAttachment);
    const hasContent = Boolean(comment.trim() || hasMedia);
    const remaining = MAX_LENGTH - comment.length;

    const togglePanel = (panel) => {
        if (textareaRef.current) caretRef.current = textareaRef.current.selectionStart;
        setActivePanel((current) => (current === panel ? null : panel));
    };

    const handleSubmit = () => {
        if (!hasContent || uploadingImage) return;
        onSubmit?.({
            content: comment.trim(),
            images: [gifAttachment, ...imageAttachments].filter(Boolean),
        });
        onClose?.();
    };

    // Insert emoji at the caret instead of always appending; keep the tray open for multiple picks.
    const handleEmojiSelect = (emojiData) => {
        const emoji = emojiData?.emoji;
        if (!emoji) return;
        setComment((prev) => {
            const pos = caretRef.current ?? prev.length;
            const next = `${prev.slice(0, pos)}${emoji}${prev.slice(pos)}`;
            if (next.length > MAX_LENGTH) return prev;
            caretRef.current = pos + emoji.length;
            return next;
        });
    };

    const handleGifSelect = (url) => {
        setGifAttachment(url);
        setActivePanel(null);
        textareaRef.current?.focus();
    };

    const handleMediaUpload = async (event) => {
        const files = Array.from(event.target.files || []).filter((f) => f.type.startsWith("image/"));
        event.target.value = "";
        if (!files.length) return;

        setUploadError("");
        setUploadingImage(true);
        setActivePanel(null);
        try {
            const formData = new FormData();
            files.forEach((file) => formData.append("files", file));
            const response = await fetch("/api/chat/upload", { method: "POST", body: formData });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.error || "Failed to upload images");

            const urls = (data.files || [])
                .filter((m) => m?.mimeType?.startsWith("image/") && m?.url)
                .map((m) => m.url);
            if (urls.length) setImageAttachments((prev) => [...prev, ...urls]);
        } catch (error) {
            console.error(error);
            setUploadError(error.message || "Failed to upload images");
        } finally {
            setUploadingImage(false);
        }
    };

    const modal = (
        <div
            className="cm-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose?.();
            }}
        >
            <style>{styles}</style>
            <div ref={dialogRef} className="cm-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
                <div className="cm-header">
                    <h2 id={titleId} className="cm-title">Add a comment</h2>
                    <button type="button" className="cm-icon-btn" onClick={onClose} aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                <div className="cm-body">
                    <textarea
                        ref={textareaRef}
                        className="cm-textarea"
                        style={{ minHeight: hasMedia || activePanel ? 72 : 160 }}
                        placeholder="Write your comment here..."
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        onSelect={(event) => (caretRef.current = event.currentTarget.selectionStart)}
                        onKeyDown={(event) => {
                            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                                event.preventDefault();
                                handleSubmit();
                            }
                        }}
                        maxLength={MAX_LENGTH}
                        aria-label="Comment"
                        autoFocus
                    />

                    {hasMedia && (
                        <div className="cm-media">
                            {gifAttachment && (
                                <div className="cm-media-card cm-gif">
                                    <img src={gifAttachment} alt="Selected GIF" />
                                    <button type="button" className="cm-remove" onClick={() => setGifAttachment("")} aria-label="Remove GIF">
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                            {imageAttachments.map((url, index) => (
                                <div className="cm-media-card" key={`${url}-${index}`}>
                                    <img src={url} alt={`Attachment ${index + 1}`} />
                                    <button
                                        type="button"
                                        className="cm-remove"
                                        onClick={() => setImageAttachments((prev) => prev.filter((_, i) => i !== index))}
                                        aria-label={`Remove image ${index + 1}`}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {uploadError && <p className="cm-error" role="alert">{uploadError}</p>}

                {/* Pickers dock inside the dialog so they can never be clipped by overflow. */}
                {activePanel && (
                    <div className="cm-tray" role="region" aria-label={activePanel === "emoji" ? "Emoji picker" : "GIF picker"}>
                        {activePanel === "emoji" ? (
                            <EmojiPicker
                                onEmojiClick={handleEmojiSelect}
                                width="100%"
                                height="100%"
                                lazyLoadEmojis
                                previewConfig={{ showPreview: false }}
                                skinTonesDisabled
                            />
                        ) : (
                            <CommentGifPicker onSelect={handleGifSelect} />
                        )}
                    </div>
                )}

                <div className="cm-footer">
                    <div className="cm-tools">
                        <button
                            type="button"
                            className="cm-icon-btn"
                            onClick={() => togglePanel("emoji")}
                            aria-pressed={activePanel === "emoji"}
                            aria-label="Add emoji"
                        >
                            <Smile size={20} />
                        </button>
                        <button
                            type="button"
                            className="cm-icon-btn"
                            onClick={() => mediaInputRef.current?.click()}
                            disabled={uploadingImage}
                            aria-label={uploadingImage ? "Uploading image" : "Add image"}
                        >
                            {uploadingImage ? <Loader2 size={20} className="cm-spin" /> : <ImageIcon size={20} />}
                        </button>
                        <button
                            type="button"
                            className="cm-icon-btn"
                            onClick={() => togglePanel("gif")}
                            aria-pressed={activePanel === "gif"}
                            aria-label="Add GIF"
                        >
                            <GifIcon />
                        </button>
                        <input
                            ref={mediaInputRef}
                            type="file"
                            className="cm-hidden"
                            onChange={handleMediaUpload}
                            accept="image/*"
                            multiple
                            tabIndex={-1}
                        />
                    </div>

                    <div className="cm-actions">
                        <span className={`cm-count${remaining <= 50 ? " cm-warn" : ""}`} aria-live="polite">
                            {remaining}
                        </span>
                        <button type="button" className="cm-btn cm-btn-ghost" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="cm-btn cm-btn-primary"
                            onClick={handleSubmit}
                            disabled={!hasContent || uploadingImage}
                        >
                            Comment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
};

export default CommentModal;
