"use client";

import ReliableImage from "./ReliableImage";
import "./PostMediaGrid.css";

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".ogg"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"];

const cleanUrl = (url = "") => String(url).split("?")[0].toLowerCase();

export const isVideoMediaUrl = (url) => {
  const clean = cleanUrl(url);
  return VIDEO_EXTENSIONS.some((extension) => clean.endsWith(extension));
};

export const isImageMediaUrl = (url) => {
  const clean = cleanUrl(url);
  return IMAGE_EXTENSIONS.some((extension) => clean.endsWith(extension));
};

const normalizeMediaItems = (media) => {
  if (!Array.isArray(media)) return [];

  return media
    .map((item) => {
      if (typeof item === "string") {
        const url = item.trim();
        if (!url) return null;
        return { url, type: isVideoMediaUrl(url) ? "video" : "image" };
      }

      if (item && typeof item === "object") {
        const url = typeof item.url === "string" ? item.url.trim() : "";
        if (!url) return null;
        const explicitType = typeof item.type === "string" ? item.type.toLowerCase() : "";
        return {
          url,
          type: explicitType.startsWith("video") || isVideoMediaUrl(url) ? "video" : "image",
          alt: item.alt,
        };
      }

      return null;
    })
    .filter(Boolean)
    .slice(0, 4);
};

export default function PostMediaGrid({ media, images, className = "", altPrefix = "Post media" }) {
  const items = normalizeMediaItems(media || images);

  if (!items.length) return null;

  const countClass = `post-media-grid--count-${Math.min(items.length, 4)}`;
  const classes = ["post-media-grid", countClass, className].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      {items.map((item, index) => (
        <div className="post-media-grid__item" key={`${item.url}-${index}`}>
          {item.type === "video" ? (
            <video
              src={item.url}
              className="post-media-grid__media"
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            <ReliableImage
              src={item.url}
              alt={item.alt || `${altPrefix} ${index + 1}`}
              className="post-media-grid__media"
              maxRetries={2}
              fallbackSrc="/Profilepic.png"
            />
          )}
        </div>
      ))}
    </div>
  );
}
