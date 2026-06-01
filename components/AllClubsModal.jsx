"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X, ArrowRight } from "lucide-react";
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
            className="relative w-full max-w-[440px] overflow-hidden rounded-[28px] bg-white"
            style={{
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.9) inset, 0 0 0 1px rgba(0,0,0,0.06), 0 30px 60px -20px rgba(0,0,0,0.25), 0 12px 24px -12px rgba(0,0,0,0.12)",
            }}
          >
            <div className="relative px-7 pt-7 pb-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] tracking-wide uppercase text-neutral-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-black" />
                    Registered clubs
                  </div>
                  <h2 className="mt-3 tracking-tight text-black">All Clubs</h2>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="-mr-1 -mt-1 rounded-full p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-black"
                >
                  <X className="h-4 w-4" strokeWidth={2.2} />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-3 pb-3">
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
              ) : clubs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500">
                  No registered clubs found yet.
                </div>
              ) : (
                <ul className="space-y-0.5">
                  {clubs.map((club, i) => {
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
                              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
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

            <div className="relative flex items-center justify-between gap-3 border-t border-neutral-100 bg-neutral-50/60 px-7 py-4">
              <div className="flex items-center gap-2 text-neutral-500">
                <div className="flex -space-x-1.5">
                  <div className="h-5 w-5 rounded-full border-2 border-white bg-neutral-900" />
                  <div className="h-5 w-5 rounded-full border-2 border-white bg-neutral-500" />
                  <div className="h-5 w-5 rounded-full border-2 border-white bg-neutral-300" />
                </div>
                <span>{activeClubCount} registered</span>
              </div>
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
