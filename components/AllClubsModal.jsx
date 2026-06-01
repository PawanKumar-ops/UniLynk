import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { X, ArrowRight } from "lucide-react";

const clubs = [
  { name: "Aurora Society", members: "1.2k members", tag: "Arts" },
  { name: "Meridian Club", members: "892 members", tag: "Business" },
  { name: "Noir Collective", members: "2.1k members", tag: "Design" },
  { name: "Atelier Nine", members: "567 members", tag: "Craft" },
  { name: "Obsidian Circle", members: "1.0k members", tag: "Writing" },
];

export function ClubsModal({ open, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
            className="relative w-full max-w-[380px] overflow-hidden rounded-[28px] bg-white"
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
                    Membership
                  </div>
                  <h2 className="mt-3 tracking-tight text-black">Your Clubs</h2>
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

            <div className="px-3 pb-3">
              <ul className="space-y-0.5">
                {clubs.map((club, i) => (
                  <motion.li
                    key={club.name}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.28,
                      delay: 0.08 + i * 0.035,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <button className="group relative flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition hover:bg-neutral-50">
                      <div
                        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-700 text-white"
                        style={{
                          boxShadow:
                            "0 1px 0 rgba(255,255,255,0.15) inset, 0 4px 10px -2px rgba(0,0,0,0.25)",
                        }}
                      >
                        <span className="tracking-tight">
                          {club.name.charAt(0)}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-black tracking-tight">
                            {club.name}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-neutral-500">
                          <span>{club.tag}</span>
                          <span className="h-0.5 w-0.5 rounded-full bg-neutral-300" />
                          <span className="truncate">{club.members}</span>
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
                ))}
              </ul>
            </div>

            <div className="relative flex items-center justify-between gap-3 border-t border-neutral-100 bg-neutral-50/60 px-7 py-4">
              <div className="flex items-center gap-2 text-neutral-500">
                <div className="flex -space-x-1.5">
                  <div className="h-5 w-5 rounded-full border-2 border-white bg-neutral-900" />
                  <div className="h-5 w-5 rounded-full border-2 border-white bg-neutral-500" />
                  <div className="h-5 w-5 rounded-full border-2 border-white bg-neutral-300" />
                </div>
                <span>{clubs.length} active</span>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-black px-4 py-2 text-white tracking-tight transition hover:bg-neutral-800 active:scale-[0.97]"
                style={{
                  boxShadow:
                    "0 1px 0 rgba(255,255,255,0.15) inset, 0 4px 12px -2px rgba(0,0,0,0.25)",
                }}
              >
                Explore all
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
