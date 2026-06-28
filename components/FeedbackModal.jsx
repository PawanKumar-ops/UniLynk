import { useState, useEffect } from "react";
import { MessageSquare, Bug, Lightbulb, Send, X, CheckCircle2 } from "lucide-react";
import { Icon } from "@iconify/react";

const TYPES = [
    {
        id: "feedback",
        label: "Feedback",
        icon: "solar:chat-line-line-duotone",
    },
    {
        id: "bug",
        label: "Problem",
        icon: "solar:bug-line-duotone",
    },
    {
        id: "idea",
        label: "Idea",
        icon: "solar:lightbulb-linear",
    },
];

export default function FeedbackModal({ open: controlledOpen, onOpenChange }) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [type, setType] = useState("feedback");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null); // { kind: "success" | "error", text: string }

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;

    const setOpen = (nextOpen) => {
        if (isControlled) {
            onOpenChange?.(nextOpen);
        } else {
            setInternalOpen(nextOpen);
        }
    };

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    // Auto-dismiss toast
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 2500);
        return () => clearTimeout(t);
    }, [toast]);

    const reset = () => {
        setMessage("");
        setEmail("");
        setType("feedback");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) {
            setToast({ kind: "error", text: "Please add a short message" });
            return;
        }
        setSubmitting(true);
        // Simulated submission — replace with your API call.
        await new Promise((r) => setTimeout(r, 6000));
        setSubmitting(false);
        setOpen(false);
        reset();
        setToast({ kind: "success", text: "Thanks! Your message was sent." });
    };

    return (
        <>
            {/* Modal */}
            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="fb-title"
                >
                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]"
                        onClick={() => setOpen(false)}
                    />

                    {/* Card */}
                    <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 animate-[popIn_180ms_cubic-bezier(0.16,1,0.3,1)]">
                        {/* Close button */}

                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="absolute right-3 top-3 rounded-full p-1 text-black/40 transition hover:bg-black/5 hover:text-black"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        {/* Header */}
                        <div className="p-5 pb-4">
                            <h2 id="fb-title" className="text-base font-semibold tracking-tight text-neutral-900">
                                Share your thoughts
                            </h2>
                            <p className="mt-1 text-xs text-neutral-500">
                                We read every message. Report a problem or suggest an improvement.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4 px-5 pb-5">
                            {/* Type tabs */}
                            <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-neutral-100 p-1">
                                {TYPES.map(({ id, label, icon }) => {
                                    const active = type === id;

                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => setType(id)}
                                            className={`flex flex-col items-center gap-1 rounded-lg py-2 text-xs font-medium transition-all ${active
                                                ? "bg-white text-neutral-900 shadow-sm"
                                                : "text-neutral-500 hover:text-neutral-800"
                                                }`}
                                        >
                                            <Icon
                                                icon={icon}
                                                width={16}
                                                height={16}
                                            />
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label htmlFor="fb-email" className="text-xs font-medium text-neutral-700">
                                    Email <span className="text-neutral-400">(optional)</span>
                                </label>
                                <input
                                    id="fb-email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
                                />
                            </div>

                            {/* Message */}
                            <div className="space-y-1.5">
                                <label htmlFor="fb-message" className="text-xs font-medium text-neutral-700">
                                    Message
                                </label>
                                <textarea
                                    id="fb-message"
                                    rows={4}
                                    placeholder={
                                        type === "bug"
                                            ? "What went wrong? Steps to reproduce…"
                                            : type === "idea"
                                                ? "What would you like to see?"
                                                : "Tell us what's on your mind…"
                                    }
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex px-3 py-2 w-full items-center justify-center gap-2 rounded-full bg-black text-white text-sm font-semibold transition-all duration-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400 disabled:shadow-none"
                            >
                                {submitting ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                                ) : (
                                    <>
                                        Send
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-5 left-1/2 z-60 -translate-x-1/2 animate-[popIn_180ms_ease-out]">
                    <div
                        className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm shadow-lg ring-1 ${toast.kind === "success"
                            ? "bg-white text-neutral-900 ring-black/5"
                            : "bg-red-50 text-red-700 ring-red-200"
                            }`}
                    >
                        {toast.kind === "success" ? (
                            <Icon
                                icon="solar:check-circle-linear"
                                width={18}
                                height={18}
                                style={{ color: "#059669" }}
                            />
                        ) : (
                            <Icon
                                icon="solar:close-circle-linear"
                                width={18}
                                height={18}
                                style={{ color: "#dc2626" }}
                            />
                        )}
                        {toast.text}
                    </div>
                </div>
            )}

            {/* Tiny keyframes (Tailwind arbitrary animations reference these names) */}
            <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popIn {
          0% { opacity: 0; transform: translateY(8px) scale(0.96) }
          100% { opacity: 1; transform: translateY(0) scale(1) }
        }
      `}</style>
        </>
    );
}
