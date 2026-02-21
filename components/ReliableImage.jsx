"use client";

import { useEffect, useMemo, useState } from "react";

const addCacheBust = (url, seed) => {
  if (!url) return "";

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}cb=${seed}`;
};

const ReliableImage = ({ src, fallbackSrc, maxRetries = 2, alt = "", ...props }) => {
  const baseSrc = useMemo(() => src || fallbackSrc || "", [src, fallbackSrc]);
  const [retryCount, setRetryCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(baseSrc);

  useEffect(() => {
    setRetryCount(0);
    setCurrentSrc(baseSrc);
  }, [baseSrc]);

  const handleError = () => {
    if (retryCount < maxRetries && src) {
      const nextCount = retryCount + 1;
      setRetryCount(nextCount);
      setCurrentSrc(addCacheBust(src, `${Date.now()}-${nextCount}`));
      return;
    }

    setCurrentSrc(fallbackSrc || "");
  };

  return <img {...props} src={currentSrc} alt={alt} onError={handleError} />;
};

export default ReliableImage;
