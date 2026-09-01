"use client";

import { useEffect, useMemo, useState } from "react";
import { loreleiAvatar } from "@/lib/avatar";

const resolveFallback = (fallbackSrc) => {
  const safeFallback = typeof fallbackSrc === "string" ? fallbackSrc.trim() : "";
  return safeFallback && safeFallback !== "/Profilepic.png" ? safeFallback : loreleiAvatar();
};

const addCacheBust = (url, seed) => {
  if (!url) return "";

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}cb=${seed}`;
};

const ReliableImage = ({ src, fallbackSrc, maxRetries = 2, alt = "", ...props }) => {
  const baseSrc = useMemo(() => {
    const safeSrc = typeof src === "string" ? src.trim() : "";
    // Some older records still point at the removed bundled placeholder.
    // Prefer the caller's generated fallback instead of rendering a broken img.
    if (safeSrc && safeSrc !== "/Profilepic.png") return safeSrc;
    return resolveFallback(fallbackSrc);
  }, [src, fallbackSrc]);
  
  const [retryCount, setRetryCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(baseSrc);

  useEffect(() => {
    setRetryCount(0);
    setCurrentSrc(baseSrc);
  }, [baseSrc]);

  const handleError = () => {
    const safeSrc = typeof src === "string" ? src.trim() : "";
    const safeFallback = resolveFallback(fallbackSrc);

    if (retryCount < maxRetries && safeSrc) {
      const nextCount = retryCount + 1;
      setRetryCount(nextCount);
      setCurrentSrc(addCacheBust(safeSrc, `${Date.now()}-${nextCount}`));
      return;
    }

    setCurrentSrc(safeFallback);
  };

  if (!currentSrc) return null;

  return <img {...props} src={currentSrc} alt={alt} onError={handleError} />;
};

export default ReliableImage;
