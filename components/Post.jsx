"use client"

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom';
import EmojiPicker from "emoji-picker-react";
import { useSession } from 'next-auth/react';
import ChatGiphyPicker from "@/components/shared/ChatGiphyPicker";
import "./Post.css"

const FLOATING_PANEL_STYLE = {
    position: "fixed",
    border: "1px solid #e3e6eb",
    borderRadius: "12px",
    background: "#fff",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)",
    padding: 0,
    overflow: "hidden",
    zIndex: 1000,
};

const Post = ({ setIspost, audience = "for-you", onPosted }) => {
    const { data: session } = useSession();
    const fileInputRef = useRef(null);
    const emojiButtonRef = useRef(null);
    const gifButtonRef = useRef(null);
    const pickerPanelRef = useRef(null);

    const [content, setContent] = useState("");
    const [images, setImages] = useState([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0, width: 320 });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAutoGrow = (e) => {
        const el = e.target;
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
    };

    const isPickerVisible = showEmojiPicker || showGifPicker;

    const handlePickImages = () => fileInputRef.current?.click();

    const updatePickerPosition = (targetElement, isGif = false) => {
        if (!targetElement) return;
        const rect = targetElement.getBoundingClientRect();
        const panelWidth = isGif ? Math.min(380, window.innerWidth - 16) : 320;
        const left = Math.min(Math.max(8, rect.left), window.innerWidth - panelWidth - 8);
        const top = Math.max(8, rect.top - (isGif ? 430 : 370));
        setPickerPosition({ top, left, width: panelWidth });
    };

    useEffect(() => {
        if (!isPickerVisible) return;

        const handleOutsideClick = (event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;

            if (
                pickerPanelRef.current?.contains(target) ||
                emojiButtonRef.current?.contains(target) ||
                gifButtonRef.current?.contains(target)
            ) {
                return;
            }

            setShowEmojiPicker(false);
            setShowGifPicker(false);
        };

        const handleViewportChange = () => {
            if (showEmojiPicker) {
                updatePickerPosition(emojiButtonRef.current, false);
            }
            if (showGifPicker) {
                updatePickerPosition(gifButtonRef.current, true);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("touchstart", handleOutsideClick);
        window.addEventListener("resize", handleViewportChange);
        window.addEventListener("scroll", handleViewportChange, true);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("touchstart", handleOutsideClick);
            window.removeEventListener("resize", handleViewportChange);
            window.removeEventListener("scroll", handleViewportChange, true);
        };
    }, [isPickerVisible, showEmojiPicker, showGifPicker]);

    const handleImageChange = async (e) => {
        const files = Array.from(e.target.files || []).slice(0, 4 - images.length);
        if (!files.length) return;

        setIsSubmitting(true);
        try {
            const uploaded = [];
            for (const file of files) {
                const formData = new FormData();
                formData.append("file", file);

                const res = await fetch("/api/posts/upload-image", {
                    method: "POST",
                    body: formData,
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data?.error || "Image upload failed");
                uploaded.push(data.url);
            }
            setImages((prev) => [...prev, ...uploaded].slice(0, 4));
        } catch (error) {
            console.error(error);
            alert("Could not upload image");
        } finally {
            setIsSubmitting(false);
            e.target.value = "";
        }
    };

    const handleEmojiSelect = (emojiData) => {
        if (!emojiData?.emoji) return;
        setContent((prev) => `${prev}${emojiData.emoji}`);
        setShowEmojiPicker(false);
    };

    const handleGifSelect = (gifUrl) => {
        if (!gifUrl) return;
        setImages((prev) => [...prev, gifUrl].slice(0, 4));
        setShowGifPicker(false);
    };

    const pickerNode = typeof document !== "undefined" && isPickerVisible
        ? showEmojiPicker
            ? createPortal(
                <div
                    ref={pickerPanelRef}
                    className="chat-picker"
                    style={{
                        ...FLOATING_PANEL_STYLE,
                        top: pickerPosition.top,
                        left: pickerPosition.left,
                    }}
                >
                    <EmojiPicker onEmojiClick={handleEmojiSelect} width={320} height={360} lazyLoadEmojis />
                </div>,
                document.body
            )
            : createPortal(
                <div
                    ref={pickerPanelRef}
                    className="chat-picker chat-gif-picker"
                    style={{
                        ...FLOATING_PANEL_STYLE,
                        top: pickerPosition.top,
                        left: pickerPosition.left,
                        width: pickerPosition.width,
                        maxWidth: "min(92vw, 380px)",
                        height: "420px",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <ChatGiphyPicker onSelect={handleGifSelect} />
                </div>,
                document.body
            )
        : null;

    const handleSubmit = async () => {
        if (isSubmitting) return;
        if (!content.trim() && images.length === 0) {
            alert("Write something or upload at least one image");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content,
                    audience,
                    images,
                    authorName: session?.user?.name,
                    authorImage: session?.user?.image,
                    authorEmail: session?.user?.email,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Post failed");

            onPosted?.(data.post);
            setContent("");
            setImages([]);
            setShowEmojiPicker(false);
            setShowGifPicker(false);
            setIspost(false);
        } catch (error) {
            console.error(error);
            alert("Could not publish post");
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className='postbody'>

            <button className='back' onClick={() => { setIspost(false) }} >
                <img src="/Postimg/cross.svg" alt="Close" />
            </button>

            <textarea className='postbar'
                rows={1}
                onInput={handleAutoGrow}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder='Write a post...'
            />
            {!!images.length && (
                <div className="image-grid count-2" style={{ marginBottom: "10px" }}>
                    {images.map((url, idx) => (
                        <img key={`${url}-${idx}`} src={url} alt="Post upload" />
                    ))}
                </div>
            )}
            <hr className='mt-2 mb-4' />

            <div className="postfoot">
            <div className="posttools">

                     <button type="button" className='mediaicon' onClick={handlePickImages} disabled={isSubmitting}><img src="./Postimg/media.svg" alt="" /></button>
                    <button
                        type="button"
                        ref={emojiButtonRef}
                        className='emojiicon'
                        onClick={() => {
                            updatePickerPosition(emojiButtonRef.current, false);
                            setShowEmojiPicker((prev) => !prev);
                            setShowGifPicker(false);
                        }}
                    ><img src="./Postimg/emoji.svg" alt="" /></button>
                    <button
                        type="button"
                        ref={gifButtonRef}
                        className='gificon'
                        onClick={() => {
                            updatePickerPosition(gifButtonRef.current, true);
                            setShowGifPicker((prev) => !prev);
                            setShowEmojiPicker(false);
                        }}
                    ><img src="./Postimg/gif.svg" alt="" /></button>
                    <button type="button" className='pollicon'><img src="./Postimg/poll.svg" alt="" /></button>
            </div>

            <button onClick={handleSubmit} disabled={isSubmitting}>
                    <div className="posttext">{isSubmitting ? "Posting..." : "Post"}</div>
                </button>

            </div>
            {pickerNode}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleImageChange}
            />
        </div>
    )
}

export default Post
