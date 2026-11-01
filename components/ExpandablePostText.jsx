"use client";

import { useLayoutEffect, useRef, useState } from "react";

const COLLAPSED_LINES = 6;

/**
 * Post body text that collapses long posts to a few lines with "See more".
 * Inherits the surrounding .post-content typography so it looks unchanged.
 */
export default function ExpandablePostText({ text }) {
  const ref = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || expanded) return undefined;
    const measure = () => setOverflowing(el.scrollHeight - el.clientHeight > 1);
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, expanded]);

  if (!text) return null;

  const collapsedStyle = expanded
    ? undefined
    : { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: COLLAPSED_LINES, overflow: "hidden" };

  return (
    <>
      <span ref={ref} style={collapsedStyle} className="block">
        {text}
      </span>
      {(overflowing || expanded) && (
        <button
          type="button"
          onClick={(event) => {
            // Posts are often clickable cards; toggling must not open the post.
            event.stopPropagation();
            setExpanded((value) => !value);
          }}
          aria-expanded={expanded}
          // Matches whatever text size the post is shown at.
          style={{ fontSize: "inherit", lineHeight: "inherit" }}
          className="mt-0.5 block border-0 bg-transparent p-0 font-semibold text-[#1d9bf0] hover:underline"
        >
          {expanded ? "See less" : "See more"}
        </button>
      )}
    </>
  );
}
