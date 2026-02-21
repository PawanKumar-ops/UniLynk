"use client"

import React, { useRef, useState } from 'react'
import { useSession } from 'next-auth/react';
import "./Post.css"

const Post = ({ setIspost, audience = "for-you", onPosted }) => {
    const { data: session } = useSession();
    const fileInputRef = useRef(null);
    const [content, setContent] = useState("");
    const [images, setImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAutoGrow = (e) => {
        const el = e.target;
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
    };


    const handlePickImages = () => fileInputRef.current?.click();

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
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Post failed");

            onPosted?.(data.post);
            setContent("");
            setImages([]);
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

                     <button className='mediaicon' onClick={handlePickImages} disabled={isSubmitting}><img src="./Postimg/media.svg" alt="" /></button>
                    <button className='emojiicon'><img src="./Postimg/emoji.svg" alt="" /></button>
                    <button className='gificon'><img src="./Postimg/gif.svg" alt="" /></button>
                    <button className='pollicon'><img src="./Postimg/poll.svg" alt="" /></button>
            </div>

            <button onClick={handleSubmit} disabled={isSubmitting}>
                    <div className="posttext">{isSubmitting ? "Posting..." : "Post"}</div>
                </button>
            
            </div>
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
