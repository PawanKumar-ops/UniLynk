const DICEBEAR_LORELEI_URL = "https://api.dicebear.com/9.x/lorelei/svg";

/**
 * Returns a stable, generated profile image for an account that has not
 * uploaded one.  Email is intentionally the seed so the same user is
 * represented consistently throughout the dashboard.
 */
export const loreleiAvatar = (email) => {
  const seed = typeof email === "string" && email.trim()
    ? email.trim().toLowerCase()
    : "unilynk-user";

  return `${DICEBEAR_LORELEI_URL}?seed=${encodeURIComponent(seed)}&backgroundColor=ffffff`;
};

export const profileAvatar = (image, email) => {
  const normalizedImage = typeof image === "string" ? image.trim() : "";
  // Existing accounts may still store the old bundled placeholder. It is not
  // an uploaded photo and must follow the new generated-avatar path.
  if (normalizedImage && normalizedImage !== "/Profilepic.png") return normalizedImage;
  return loreleiAvatar(email);
};
