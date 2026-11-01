// Shared rules for documents attached to posts (client and server).

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // Cloudinary raw upload limit on the free plan

export const DOCUMENT_TYPES = {
  pdf: { label: "PDF", mime: "application/pdf", color: "#e5484d", viewer: "inline" },
  doc: { label: "Word", mime: "application/msword", color: "#2b6cde", viewer: "office" },
  docx: { label: "Word", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", color: "#2b6cde", viewer: "office" },
  xls: { label: "Excel", mime: "application/vnd.ms-excel", color: "#1f8f4e", viewer: "office" },
  xlsx: { label: "Excel", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", color: "#1f8f4e", viewer: "office" },
  csv: { label: "CSV", mime: "text/csv", color: "#1f8f4e", viewer: "inline" },
  ppt: { label: "PowerPoint", mime: "application/vnd.ms-powerpoint", color: "#d9602b", viewer: "office" },
  pptx: { label: "PowerPoint", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", color: "#d9602b", viewer: "office" },
  txt: { label: "Text", mime: "text/plain", color: "#62748e", viewer: "inline" },
};

export const DOCUMENT_ACCEPT = Object.keys(DOCUMENT_TYPES).map((ext) => `.${ext}`).join(",");

export function documentExtension(name = "") {
  const match = String(name).toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "";
}

export function isAllowedDocument(name) {
  return Boolean(DOCUMENT_TYPES[documentExtension(name)]);
}

export function formatFileSize(bytes = 0) {
  const size = Number(bytes) || 0;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/** Same-origin route that serves the file with the right type (inline or download). */
export function documentFileUrl(doc, { download = false } = {}) {
  const params = new URLSearchParams({ url: doc.url, name: doc.name || "document" });
  if (download) params.set("download", "1");
  return `/api/documents/open?${params.toString()}`;
}

/**
 * Where "Open" goes. PDFs/text open in the browser via our route. Office files
 * open in Microsoft's free viewer, which fetches the public Cloudinary URL.
 */
export function documentViewUrl(doc) {
  const type = DOCUMENT_TYPES[doc?.ext || documentExtension(doc?.name)];
  if (type?.viewer === "office") {
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(doc.url)}`;
  }
  return documentFileUrl(doc);
}
