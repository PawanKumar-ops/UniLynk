"use client";

import { Download, ExternalLink } from "lucide-react";
import { DOCUMENT_TYPES, documentExtension, documentFileUrl, documentViewUrl, formatFileSize } from "@/lib/documents";

/** Badge showing the file type, e.g. a red "PDF" tile. */
export function DocumentBadge({ ext, size = 44 }) {
  const type = DOCUMENT_TYPES[ext];
  const color = type?.color || "#62748e";
  return (
    <span
      className="relative grid shrink-0 place-items-center rounded-xl"
      style={{ width: size, height: size, backgroundColor: `${color}14`, color }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
      </svg>
      <span
        className="absolute -bottom-1 rounded-md px-1 text-[9px] font-extrabold uppercase leading-[14px] tracking-wide text-white"
        style={{ backgroundColor: color }}
      >
        {(ext || "file").slice(0, 4)}
      </span>
    </span>
  );
}

/** Document attached to a post: opens in a new tab, with a separate download. */
export default function PostDocument({ document: doc }) {
  if (!doc?.url) return null;
  const ext = doc.ext || documentExtension(doc.name);
  const type = DOCUMENT_TYPES[ext];
  const details = [type?.label || ext.toUpperCase() || "File", doc.size ? formatFileSize(doc.size) : ""].filter(Boolean).join(" · ");

  return (
    <div
      className="mt-3 flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-3 transition hover:border-black/20 hover:bg-[#f7f9fa]"
      onClick={(event) => event.stopPropagation()}
    >
      <a
        href={documentViewUrl(doc)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-0 flex-1 items-center gap-3 no-underline"
        title={`Open ${doc.name}`}
      >
        <DocumentBadge ext={ext} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-[#0f1419]">{doc.name || "Document"}</span>
          <span className="mt-0.5 flex items-center gap-1 text-[13px] text-[#536471]">
            {details}
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </span>
        </span>
      </a>
      <a
        href={documentFileUrl(doc, { download: true })}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#0f1419] transition hover:bg-black/5"
        aria-label={`Download ${doc.name}`}
        title="Download"
      >
        <Download className="h-[18px] w-[18px]" />
      </a>
    </div>
  );
}
