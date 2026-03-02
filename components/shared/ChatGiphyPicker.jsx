"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Search } from "lucide-react";
import { GiphyFetch } from "@giphy/js-fetch-api";

const GifGrid = dynamic(
  () => import("@giphy/react-components").then((module) => module.Grid),
  { ssr: false }
);

const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || "";

export default function ChatGiphyPicker({ onSelect, width = 340, columns = 2 }) {
  const [query, setQuery] = useState("");

  const giphyFetch = useMemo(() => new GiphyFetch(GIPHY_API_KEY), []);

  const fetchGifs = useCallback(
    (offset) => {
      if (query.trim()) {
        return giphyFetch.search(query, { offset, limit: 20 });
      }
      return giphyFetch.trending({ offset, limit: 20 });
    },
    [giphyFetch, query]
  );

  return (
    <div className="giphy-picker-wrapper" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="giphy-search" style={{ position: "sticky", padding: "15px 10px" }}>
        <div className="gif-search" style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: "6px", padding: "10px 12px", height: "40px", border: "1px solid #d0d6de", borderRadius: "999px", backgroundColor: "#f5f5f5" }}>
          <Search size={16} />
          <input
            style={{ width: "100%", border: "none", outline: "none", fontSize: "0.85rem", background: "transparent", padding: "9.6px 12px" }}
            type="text"
            placeholder="Search GIFs"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="giphy-grid-scroll" style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", display: "flex", justifyContent: "center" }}>
        <GifGrid
          width={width}
          columns={columns}
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
