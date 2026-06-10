"use client";

import { useCallback, useMemo, useState } from "react";
import ReliableImage from "./ReliableImage";
import "./PostMediaGrid.css";

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".ogg"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"];
const MIN_SINGLE_MEDIA_RATIO = 3 / 4;
const MAX_SINGLE_MEDIA_RATIO = 16 / 9;
const DEFAULT_SINGLE_MEDIA_RATIO = 1;

const cleanUrl = (url = "") => String(url).split("?")[0].toLowerCase();

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getAspectRatio = (width, height) => {
  if (!width || !height) return null;
  return width / height;
};

const getSingleMediaShape = (ratio) => {
  if (!ratio) return "unknown";
  if (ratio <= 0.9) return "portrait";
  if (ratio >= 1.1) return "landscape";
  return "square";
};

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
        const width = Number(item.width || item.naturalWidth || 0);
        const height = Number(item.height || item.naturalHeight || 0);

        return {
          url,
          type: explicitType.startsWith("video") || isVideoMediaUrl(url) ? "video" : "image",
          alt: item.alt,
          width,
          height,
        };
      }

      return null;
    })
    .filter(Boolean)
    .slice(0, 4);
};

export default function PostMediaGrid({ media, images, className = "", altPrefix = "Post media" }) {
  const items = useMemo(() => normalizeMediaItems(media || images), [media, images]);
  const [measuredSizes, setMeasuredSizes] = useState({});

  const recordMediaSize = useCallback((index, width, height) => {
    if (!width || !height) return;

    setMeasuredSizes((currentSizes) => {
      const currentSize = currentSizes[index];
      if (currentSize?.width === width && currentSize?.height === height) return currentSizes;

      return {
        ...currentSizes,
        [index]: { width, height },
      };
    });
  }, []);

  if (!items.length) return null;

  const mediaCount = Math.min(items.length, 4);
  const countClass = `post-media-grid--count-${mediaCount}`;
  const firstItem = items[0];
  const firstMeasuredSize = measuredSizes[0];
  const firstRatio = getAspectRatio(
    firstMeasuredSize?.width || firstItem?.width,
    firstMeasuredSize?.height || firstItem?.height,
  );
  const singleMediaRatio = clamp(
    firstRatio || DEFAULT_SINGLE_MEDIA_RATIO,
    MIN_SINGLE_MEDIA_RATIO,
    MAX_SINGLE_MEDIA_RATIO,
  );
  const singleShapeClass = mediaCount === 1 ? `post-media-grid--single-${getSingleMediaShape(firstRatio)}` : "";
  const classes = ["post-media-grid", countClass, singleShapeClass, className].filter(Boolean).join(" ");
  const gridStyle = mediaCount === 1 ? { "--post-media-aspect-ratio": singleMediaRatio } : undefined;

  return (
    <div className={classes} style={gridStyle}>
      {items.map((item, index) => (
        <div className="post-media-grid__item" key={`${item.url}-${index}`}>
          {item.type === "video" ? (
            <video
              src={item.url}
              className="post-media-grid__media"
              controls
              playsInline
              preload="metadata"
              onLoadedMetadata={(event) => {
                recordMediaSize(index, event.currentTarget.videoWidth, event.currentTarget.videoHeight);
              }}
            />
          ) : (
            <ReliableImage
              src={item.url}
              alt={item.alt || `${altPrefix} ${index + 1}`}
              className="post-media-grid__media"
              maxRetries={2}
              fallbackSrc="/Profilepic.png"
              onLoad={(event) => {
                recordMediaSize(index, event.currentTarget.naturalWidth, event.currentTarget.naturalHeight);
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
