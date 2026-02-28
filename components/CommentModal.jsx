"use client"

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    Smile,
    Image as ImageIcon,
    X,
} from 'lucide-react';
import EmojiPicker from "emoji-picker-react";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Grid } from "@giphy/react-components";
import './CommentModal.css';

const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || "";
const gf = new GiphyFetch(GIPHY_API_KEY);

function CommentGifPicker({ onSelect }) {
    const [query, setQuery] = useState("");

    const fetchGifs = (offset) => {
        if (query.trim()) {
            return gf.search(query, { offset, limit: 20 });
        }
        return gf.trending({ offset, limit: 20 });
    };

    return (
        <div className="comment-gif-picker-wrapper">
            <div className="comment-gif-search">
                <input
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search GIFs"
                />
            </div>
            <div className="comment-gif-grid">
                <Grid
                    width={300}
                    columns={2}
                    gutter={8}
                    fetchGifs={fetchGifs}
                    key={query}
                    onGifClick={(gif, event) => {
                        event.preventDefault();
                        const gifUrl = gif.images.original?.url || gif.images.fixed_height?.url;
                        const fallbackVideoUrl = gif.images.original_mp4?.mp4 || gif.images.fixed_height?.mp4;

                        if (gifUrl || fallbackVideoUrl) {
                            onSelect(gifUrl || fallbackVideoUrl);
                        }
                    }}
                />
            </div>
        </div>
    );
}



const CommentModal = ({ isOpen, onClose, onSubmit }) => {
    const [comment, setComment] = useState('');
    const [isMounted, setIsMounted] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imageAttachments, setImageAttachments] = useState([]);
    const [gifAttachment, setGifAttachment] = useState('');

    const mediaInputRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const previousOverflow = document.body.style.overflow;

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose?.();
            }
        };

        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen) {
            setComment('');
           setShowEmojiPicker(false);
            setShowGifPicker(false);
            setUploadingImage(false);
            setImageAttachments([]);
            setGifAttachment('');

        }
    }, [isOpen]);

    useEffect(() => {
        if (!textareaRef.current) return;

        textareaRef.current.style.height = 'auto';
        const maxTextareaHeight = 260;
        const nextHeight = Math.min(textareaRef.current.scrollHeight, maxTextareaHeight);

        textareaRef.current.style.height = `${nextHeight}px`;
        textareaRef.current.style.overflowY = textareaRef.current.scrollHeight > maxTextareaHeight ? 'auto' : 'hidden';
    }, [comment, imageAttachments.length, gifAttachment]);

    if (!isOpen || !isMounted) return null;

    const hasContent = Boolean(comment.trim() || imageAttachments.length || gifAttachment);

    const handleSubmit = () => {
        if (!hasContent) return;

        const payloadText = comment.trim();
        const mediaUrls = [gifAttachment, ...imageAttachments].filter(Boolean);

        if (typeof onSubmit === 'function') {
            if (mediaUrls.length) {
                const combined = [payloadText, ...mediaUrls].filter(Boolean).join('\n');
                onSubmit(combined);
            } else {
                onSubmit(payloadText);
            }
        }

        onClose?.();
    };

    const handleOverlayClick = (event) => {
        if (event.target === event.currentTarget) {
            onClose?.();
        }
    };

 const handleEmojiSelect = (emojiData) => {
        if (!emojiData?.emoji) return;
        setComment((prev) => `${prev}${emojiData.emoji}`);
        setShowEmojiPicker(false);
    };

    const handleGifSelect = (mediaUrl) => {
        if (!mediaUrl) return;
        setGifAttachment(mediaUrl);
        setShowGifPicker(false);
    };

    const uploadSelectedFiles = async (selectedFiles) => {
        const formData = new FormData();
        selectedFiles.forEach((file) => formData.append('files', file));

        const response = await fetch('/api/chat/upload', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to upload files');
        }

        return data.files || [];
    };

    const handleMediaUpload = async (event) => {
        const selectedFiles = Array.from(event.target.files || []);
        event.target.value = '';

        if (!selectedFiles.length) return;

        try {
            setUploadingImage(true);
            const uploadedMedia = await uploadSelectedFiles(selectedFiles);
            const imageUrls = uploadedMedia
                .filter((media) => media?.mimeType?.startsWith('image/') && media?.url)
                .map((media) => media.url);

            if (imageUrls.length) {
                setImageAttachments((prev) => [...prev, ...imageUrls]);
            }

            setShowEmojiPicker(false);
            setShowGifPicker(false);
        } catch (error) {
            console.error(error);
        } finally {
            setUploadingImage(false);
        }
    };


    const modal = (
        <div className="comment-modal-overlay" onClick={handleOverlayClick}>
            <div
                className="comment-modal-container"
                role="dialog"
                aria-modal="true"
                aria-labelledby="comment-modal-title"
            >
                <div className="comment-modal-header">
                    <h2 id="comment-modal-title" className="comment-modal-title">Add a Comment</h2>
                    <button className="comment-modal-close" onClick={onClose} aria-label="Close comment modal" type="button">
                        ×
                    </button>
                </div>

                <div className="comment-modal-body">
                    <textarea
                    ref={textareaRef}
                        className="comment-textarea"
                        style={{ minHeight: imageAttachments.length || gifAttachment ? '100px' : '200px' }}
                        placeholder="Write your comment here..."
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        onKeyDown={(event) => {
                            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                                handleSubmit();
                            }
                        }}
                        rows={6}
                        autoFocus
                        maxLength={1000}
                    />

                     {!!gifAttachment && (
                        <div className="comment-media-card comment-gif-card">
                            <img src={gifAttachment} alt="Selected GIF" className="comment-gif-preview" />
                            <button
                                type="button"
                                className="comment-media-remove"
                                onClick={() => setGifAttachment('')}
                                aria-label="Remove selected GIF"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {!!imageAttachments.length && (
                        <div className="comment-image-grid">
                            {imageAttachments.map((imageUrl, index) => (
                                <div className="comment-media-card" key={`${imageUrl}-${index}`}>
                                    <img src={imageUrl} alt={`Selected image ${index + 1}`} className="comment-image-preview" />
                                    <button
                                        type="button"
                                        className="comment-media-remove"
                                        onClick={() => setImageAttachments((prev) => prev.filter((_, idx) => idx !== index))}
                                        aria-label={`Remove selected image ${index + 1}`}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="comment-modal-footer">
                    <div className="comment-modal-footer-left">
                        <div className="comment-picker-wrap">
                            <button
                                className='comment-modalfoot-left-btn comment-modalfoot-left-emoji'
                                type="button"
                                onClick={() => {
                                    setShowEmojiPicker((prev) => !prev);
                                    setShowGifPicker(false);
                                }}
                            >
                                <Smile width={20} />
                            </button>
                            {showEmojiPicker && (
                                <div className="comment-picker comment-emoji-picker">
                                    <EmojiPicker onEmojiClick={handleEmojiSelect} width={320} height={360} lazyLoadEmojis />
                                </div>
                            )}
                        </div>

                        <button
                            className='comment-modalfoot-left-btn comment-modalfoot-left-images'
                            type="button"
                            onClick={() => mediaInputRef.current?.click()}
                            disabled={uploadingImage}
                        >
                            <ImageIcon width={20} />
                        </button>

                        <div className="comment-picker-wrap">
                            <button
                                className='comment-modalfoot-left-btn comment-modalfoot-left-gif'
                                type="button"
                                onClick={() => {
                                    setShowGifPicker((prev) => !prev);
                                    setShowEmojiPicker(false);
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill='#545454' id="gif">
                                    <path fill="none" d="M0 0h24v24H0V0z"></path>
                                    <path d="M12.25 9c.41 0 .75.34.75.75v4.5c0 .41-.34.75-.75.75s-.75-.34-.75-.75v-4.5c0-.41.34-.75.75-.75zM10 9.75c0-.41-.34-.75-.75-.75H6c-.6 0-1 .5-1 1v4c0 .5.4 1 1 1h3c.6 0 1-.5 1-1v-1.25c0-.41-.34-.75-.75-.75s-.75.34-.75.75v.75h-2v-3h2.75c.41 0 .75-.34.75-.75zm9 0c0-.41-.34-.75-.75-.75H15.5c-.55 0-1 .45-1 1v4.25c0 .41.34.75.75.75s.75-.34.75-.75V13h1.25c.41 0 .75-.34.75-.75s-.34-.75-.75-.75H16v-1h2.25c.41 0 .75-.34.75-.75z"></path>
                                </svg>
                            </button>
                            {showGifPicker && (
                                <div className="comment-picker comment-gif-picker">
                                    <CommentGifPicker onSelect={handleGifSelect} />
                                </div>
                            )}
                        </div>

                        <input
                            ref={mediaInputRef}
                            type="file"
                            className="comment-hidden-input"
                            onChange={handleMediaUpload}
                            accept="image/*"
                            multiple
                        />

                    </div>
                    <div className="comment-modal-footer-right">
                        <button className="comment-modal-button comment-modal-button-cancel" onClick={onClose} type="button">
                            Cancel
                        </button>
                        <button
                            className="comment-modal-button comment-modal-button-submit"
                            onClick={handleSubmit}
                            disabled={!hasContent}
                            type="button"
                        >
                            Comment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
    return createPortal(modal, document.body);
}

export default CommentModal;