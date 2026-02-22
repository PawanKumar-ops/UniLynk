"use client";

import { useEffect, useMemo, useState } from "react";

const addCacheBust = (url, seed) => {
  if (!url) return "";

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}cb=${seed}`;
};

const ReliableImage = ({ src, fallbackSrc, maxRetries = 2, alt = "", ...props }) => {
  const baseSrc = useMemo(() => {
    if (typeof src === "string" && src.trim()) return src.trim();
    if (typeof fallbackSrc === "string" && fallbackSrc.trim()) return fallbackSrc.trim();
    return null;
  }, [src, fallbackSrc]);
  
  const [retryCount, setRetryCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(baseSrc);

  useEffect(() => {
    setRetryCount(0);
    setCurrentSrc(baseSrc);
  }, [baseSrc]);

  const handleError = () => {
    const safeSrc = typeof src === "string" ? src.trim() : "";
    const safeFallback = typeof fallbackSrc === "string" ? fallbackSrc.trim() : "";

    if (retryCount < maxRetries && safeSrc) {
      const nextCount = retryCount + 1;
      setRetryCount(nextCount);
      setCurrentSrc(addCacheBust(safeSrc, `${Date.now()}-${nextCount}`));
      return;
    }

    setCurrentSrc(safeFallback || null);
  };

  if (!currentSrc) return null;

  return <img {...props} src={currentSrc} alt={alt} onError={handleError} />;
};

export default ReliableImage;
