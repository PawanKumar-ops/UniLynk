import { useMemo, useState } from "react";
import { Check, Forward, Search } from "lucide-react";

function cn(...classes) {
    return classes.filter(Boolean).join(" ");
}

function initials(name = "") {
    return (name || "?")
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

function SimpleAvatar({ name, avatarUrl }) {
    const [imgError, setImgError] = useState(false);
    const showFallback = !avatarUrl || imgError;
    return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-900 text-[11px] font-medium text-white">
            {showFallback ? (
                initials(name)
            ) : (
                <img
                    src={avatarUrl}
                    alt={name}
                    className="h-full w-full object-cover"
                    onError={() => setImgError(true)}
                />
            )}
        </div>
    );
}

export function ForwardMessageModal({
    open,
    onOpenChange,
    message,
    recipients = [],
    onForward,
}) {
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState([]);
    const [sending, setSending] = useState(false);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return recipients;
        return recipients.filter(
            (r) =>
                r.name.toLowerCase().includes(q) ||
                r.email?.toLowerCase().includes(q) ||
                r.communityName?.toLowerCase().includes(q) ||
                r.handle?.toLowerCase().includes(q) ||
                r.subtitle?.toLowerCase().includes(q),
        );
    }, [query, recipients]);

    const toggle = (id) =>
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );

    const handleOpenChange = (next) => {
        if (!next) {
            setQuery("");
            setSelected([]);
            setSending(false);
        }
        onOpenChange(next);
    };

    const handleSend = async () => {
        if (selected.length === 0 || !message) return;
        try {
            setSending(true);
            await onForward?.(selected);
            handleOpenChange(false);
        } catch {
            // Keep the modal open so the parent chat page can surface the forwarding error.
        } finally {
            setSending(false);
        }
    };

    const count = selected.length;

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => handleOpenChange(false)}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60" />

            {/* Modal card */}
            <div
                className="relative z-10 w-full max-w-sm gap-0 overflow-hidden rounded-3xl border-0 bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex flex-col items-center px-6 pt-7 pb-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50">
                        <Forward className="h-5 w-5 text-neutral-900" strokeWidth={2} />
                    </div>
                    <h2 className="mt-4 text-center text-[17px] font-semibold tracking-tight text-neutral-900">
                        Forward message
                    </h2>
                    <p className="mt-1 text-center text-[13px] text-neutral-500">
                        Choose who to share this message with.
                    </p>
                </div>

                {/* Search */}
                <div className="px-5">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search"
                            className="h-10 w-full rounded-full border border-neutral-200 bg-neutral-50 pl-9 pr-4 text-[13px] text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-300"
                        />
                    </div>
                </div>

                {/* Recipient list */}
                <div className="mt-3 h-60 overflow-y-auto px-3 pb-2">
                    <div className="space-y-0.5">
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 text-center">
                                <p className="text-[13px] font-medium text-neutral-900">
                                    No matches
                                </p>
                                <p className="mt-1 text-[12px] text-neutral-500">
                                    Try a different name.
                                </p>
                            </div>
                        ) : (
                            filtered.map((r) => {
                                const isSelected = selected.includes(r.id);
                                return (
                                    <button
                                        key={r.id}
                                        onClick={() => toggle(r.id)}
                                        className={cn(
                                            "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors",
                                            "hover:bg-neutral-100",
                                        )}
                                    >
                                        <SimpleAvatar name={r.name} avatarUrl={r.avatarUrl} />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[13.5px] font-medium text-neutral-900">
                                                {r.name}
                                            </p>
                                            <p className="truncate text-[11.5px] text-neutral-500">
                                                {r.email || r.communityName || r.handle || r.subtitle}
                                            </p>
                                        </div>
                                        <div
                                            className={cn(
                                                "flex h-[18px] w-[18px] items-center justify-center rounded-full border transition",
                                                isSelected
                                                    ? "border-neutral-900 bg-neutral-900 text-white"
                                                    : "border-neutral-300 bg-white",
                                            )}
                                        >
                                            {isSelected && (
                                                <Check className="h-3 w-3" strokeWidth={3.5} />
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 px-5 pb-5 pt-3">
                    <button
                        onClick={handleSend}
                        disabled={count === 0 || sending}
                        className={cn(
                            "w-full rounded-full px-4 py-3 text-[14px] font-semibold transition",
                            "bg-neutral-900 text-white hover:bg-neutral-800",
                            "disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400",
                        )}
                    >
                        {sending
                            ? "Sending…"
                            : count === 0
                                ? "Forward"
                                : `Forward${count > 1 ? ` to ${count}` : ""}`}
                    </button>
                    <button
                        onClick={() => handleOpenChange(false)}
                        className="w-full rounded-full bg-neutral-100 px-4 py-3 text-[14px] font-semibold text-neutral-900 transition hover:bg-neutral-200"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
