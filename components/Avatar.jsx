// components/Avatar.jsx
import React from "react";

// Helper functions (could be imported from a shared utils if existing)
const getInitials = (name) => {
  const parts = name?.trim().split(/\s+/) || [];
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name?.slice(0, 2).toUpperCase() || "";
};

const AVATAR_COLORS = [
  { bg: "#e8e3f7", fg: "#6e56cf" },
  { bg: "#fde8e8", fg: "#c0392b" },
  { bg: "#e3f0fd", fg: "#2b7bc0" },
  { bg: "#e6f7ee", fg: "#27ae60" },
  { bg: "#fdf3e3", fg: "#d68910" },
  { bg: "#fde8f5", fg: "#8e44ad" },
  { bg: "#e3fdf9", fg: "#16a085" },
  { bg: "#fdf5e3", fg: "#ca6f1e" },
];

const getAvatarColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name?.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

/**
 * Avatar component that displays a profile picture if `src` is provided.
 * Falls back to colored initials otherwise.
 */
export default function Avatar({ name = "", src, size = 32 }) {
  const style = {
    width: size,
    height: size,
    borderRadius: "9999px",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    fontWeight: 600,
    fontSize: size / 2.2,
    lineHeight: 1,
  };

  if (src) {
    return (
      <div style={style} aria-label={name} title={name}>
        <img
          src={src}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    );
  }

  const colors = getAvatarColor(name);
  return (
    <div
      style={{
        ...style,
        background: colors.bg,
        color: colors.fg,
      }}
      aria-label={name}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
