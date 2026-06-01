"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X, ArrowRight, Search } from "lucide-react";
import ReliableImage from "./ReliableImage";

const formatMemberCount = (count) => {
    const value = Number(count) || 0;

    if (value >= 1000) {
        return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k members`;
    }

    return `${value.toLocaleString()} ${value === 1 ? "member" : "members"}`;
};

const getInitials = (name = "") =>
    name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("") || "C";

export function AllClubsModal({ open, onClose }) {
    const [query, setQuery] = useState("");
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        if (!open) return;

        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    useEffect(() => {
        if (!open) return;

        const controller = new AbortController();

        const fetchClubs = async () => {
            setLoading(true);
            setError("");

            try {
                const res = await fetch("/api/clubs", {
                    cache: "no-store",
                    signal: controller.signal,
                });
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data?.message || "Failed to fetch clubs");
                }

                setClubs(Array.isArray(data.clubs) ? data.clubs : []);
            } catch (err) {
                if (err.name !== "AbortError") {
                    setClubs([]);
                    setError(err.message || "Failed to fetch clubs");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchClubs();

        return () => controller.abort();
    }, [open]);

    const filteredClubs = useMemo(() => {
    if (!query.trim()) return clubs;

    return clubs.filter((club) => {
        const name = club.clubName || "";
        const category = club.category || "";

        return (
            name.toLowerCase().includes(query.toLowerCase()) ||
            category.toLowerCase().includes(query.toLowerCase())
        );
    });
}, [clubs, query]);

    const activeClubCount = useMemo(() => clubs.length, [clubs]);

    const handleOpenClub = (clubId) => {
        if (!clubId) return;
        onClose();
        router.push(`/Club?clubId=${clubId}`);
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <style>{`
            .clubs-scroll::-webkit-scrollbar { width: 6px; }
            .clubs-scroll::-webkit-scrollbar-track { background: transparent; }
            .clubs-scroll::-webkit-scrollbar-thumb {
              background: rgba(0,0,0,0.12);
              border-radius: 999px;
            }
            .clubs-scroll::-webkit-scrollbar-thumb:hover {
              background: rgba(0,0,0,0.25);
            }
            .clubs-scroll { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.15) transparent; }
          `}</style>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        onClick={onClose}
                        className="absolute inset-0 bg-white/40"
                        style={{
                            backdropFilter: "blur(16px) saturate(140%)",
                            WebkitBackdropFilter: "blur(16px) saturate(140%)",
                        }}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 4 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="relative w-full max-w-[380px] md:max-w-[400px] overflow-hidden rounded-[28px] bg-white"
                        style={{
                            boxShadow:
                                "0 1px 0 rgba(255,255,255,0.9) inset, 0 0 0 1px rgba(0,0,0,0.06), 0 30px 60px -20px rgba(0,0,0,0.25), 0 12px 24px -12px rgba(0,0,0,0.12)",
                        }}
                    >
                        <div className="flex items-center justify-between px-6 pt-5 pb-3">
                            <h2 className="tracking-tight text-black font-semibold text-xl">All Clubs</h2>
                            <button
                                onClick={onClose}
                                aria-label="Close"
                                className="-mr-1 rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-black"
                            >
                                <X className="h-4 w-4" strokeWidth={2.2} />
                            </button>
                        </div>

                        <div className="px-6 pb-3">
                            <div className="flex items-center gap-2 rounded-xl bg-neutral-100 px-3 py-2 transition focus-within:bg-neutral-50 focus-within:ring-1 focus-within:ring-black/10">
                                <Search
                                    className="h-3.5 w-3.5 text-neutral-400"
                                    strokeWidth={2.2}
                                />
                                <input
                                    autoFocus
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search clubs"
                                    className="w-full bg-transparent text-black placeholder:text-neutral-400 outline-none"
                                />
                            </div>
                        </div>

                        <div className="h-[50vh] overflow-y-auto px-3 pb-3">
                            {loading ? (
                                <div className="space-y-2 px-1">
                                    {[0, 1, 2, 3].map((item) => (
                                        <div key={item} className="flex items-center gap-4 rounded-2xl px-4 py-3">
                                            <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-neutral-100" />
                                            <div className="min-w-0 flex-1 space-y-2">
                                                <div className="h-3 w-2/3 animate-pulse rounded-full bg-neutral-100" />
                                                <div className="h-3 w-1/2 animate-pulse rounded-full bg-neutral-100" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : error ? (
                                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-8 text-center text-sm text-red-600">
                                    {error}
                                </div>
                            ) : filteredClubs.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500">
                                    No registered clubs found yet.
                                </div>
                            ) : (
                                <ul className="space-y-0.5">
                                    {filteredClubs.map((club, i) => {
                                        const clubName = club.clubName || "Campus Club";
                                        const clubId = club._id || club.id;

                                        return (
                                            <motion.li
                                                key={clubId || clubName}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    duration: 0.28,
                                                    delay: 0.08 + i * 0.035,
                                                    ease: [0.22, 1, 0.36, 1],
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenClub(clubId)}
                                                    className="group relative flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition hover:bg-neutral-50"
                                                >
                                                    <div
                                                        className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-700 text-white"
                                                        style={{
                                                            boxShadow:
                                                                "0 1px 0 rgba(255,255,255,0.15) inset, 0 4px 10px -2px rgba(0,0,0,0.25)",
                                                        }}
                                                    >
                                                        {club.logo ? (
                                                            <ReliableImage
                                                                src={club.logo}
                                                                alt={`${clubName} logo`}
                                                                className="h-full w-full object-cover"
                                                                fallbackSrc="/Defaultclublogo.svg"
                                                            />
                                                        ) : (
                                                            <span className="tracking-tight">{getInitials(clubName)}</span>
                                                        )}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="truncate text-black tracking-tight">
                                                                {clubName}
                                                            </span>
                                                        </div>
                                                        <div className="mt-0.5 flex items-center gap-2 text-neutral-500">
                                                            <span className="truncate">{club.category || "Club"}</span>
                                                            <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-neutral-300" />
                                                            <span className="truncate">{formatMemberCount(club.memberCount)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 transition group-hover:bg-black group-hover:text-white">
                                                        <ArrowRight
                                                            className="h-3.5 w-3.5"
                                                            strokeWidth={2.2}
                                                        />
                                                    </div>
                                                </button>
                                            </motion.li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        <div className="relative flex justify-end border-t border-neutral-100 bg-neutral-50/60 px-7 py-4">
                            <button
                                onClick={onClose}
                                className="rounded-full bg-black px-4 py-2 text-white tracking-tight transition hover:bg-neutral-800 active:scale-[0.97]"
                                style={{
                                    boxShadow:
                                        "0 1px 0 rgba(255,255,255,0.15) inset, 0 4px 12px -2px rgba(0,0,0,0.25)",
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

export { AllClubsModal as ClubsModal };
