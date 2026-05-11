import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Crown, Search } from "lucide-react";

const members = [
  { id: "1", name: "Alexandra Chen", role: "President", avatar: "AC", joined: "2021" },
  { id: "2", name: "Marcus Rivera", role: "Vice President", avatar: "MR", joined: "2021" },
  { id: "3", name: "Sophia Bennett", role: "Secretary", avatar: "SB", joined: "2022" },
  { id: "4", name: "Ethan Walker", role: "Treasurer", avatar: "EW", joined: "2022" },
  { id: "5", name: "Isabella Moreau", role: "Member", avatar: "IM", joined: "2023" },
  { id: "6", name: "Julian Park", role: "Member", avatar: "JP", joined: "2023" },
  { id: "7", name: "Olivia Hartwell", role: "Member", avatar: "OH", joined: "2024" },
  { id: "8", name: "Nathaniel Cross", role: "Member", avatar: "NC", joined: "2024" },
];

const scrollStyles = `
  .members-scroll::-webkit-scrollbar { width: 6px; }
  .members-scroll::-webkit-scrollbar-track { background: transparent; margin: 12px 0; }
  .members-scroll::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.18);
    border-radius: 999px;
    min-height: 32px;
  }
  .members-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.35); }
  .members-scroll { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.18) transparent; }
`;

export function MembersModal({ MemberModalopen, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (MemberModalopen) {
      document.addEventListener("keydown", handler);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [MemberModalopen, onClose]);

  return (
    <AnimatePresence>
      {MemberModalopen && <style>{scrollStyles}</style>}
      {MemberModalopen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="absolute inset-0 bg-black/30 backdrop-blur-xl"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="members-title"
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)] ring-1 ring-black/5"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-start justify-between px-7 pt-7 pb-5">
              <div>
                <p className="tracking-[0.18em] uppercase text-black/50">The Club</p>
                <h2 id="members-title" className="mt-1.5 tracking-tight text-black">
                  Members
                </h2>
                <p className="mt-1 text-black/60">{members.length} active members</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="group relative grid h-10 w-10 place-items-center rounded-full bg-black/[0.04] text-black/70 transition hover:bg-black hover:text-white"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div className="px-7 pb-4">
              <div className="flex items-center gap-3 rounded-2xl bg-black/[0.04] px-4 py-3 ring-1 ring-transparent transition focus-within:bg-white focus-within:ring-black/15">
                <Search className="h-4 w-4 text-black/50" />
                <input
                  type="text"
                  placeholder="Search members..."
                  className="w-full bg-transparent text-black placeholder:text-black/40 outline-none"
                />
              </div>
            </div>

            <div className="members-scroll max-h-[420px] overflow-y-auto px-3 pb-4">
              <ul className="space-y-1">
                {members.map((m, i) => (
                  <motion.li
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + i * 0.035, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="group flex items-center gap-4 rounded-2xl px-4 py-3 transition hover:bg-black/[0.04]"
                  >
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-black text-white tracking-wide">
                      {m.avatar}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-black">{m.name}</p>
                        {m.role === "President" && (
                          <Crown className="h-3.5 w-3.5 text-black" strokeWidth={2.5} />
                        )}
                      </div>
                      <p className="truncate text-black/55">{m.role} · Joined {m.joined}</p>
                    </div>

                    <button className="rounded-full border border-black/10 px-4 py-1.5 text-black/70 opacity-0 transition group-hover:opacity-100 hover:border-black hover:bg-black hover:text-white">
                      View
                    </button>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between border-t border-black/[0.06] px-7 py-4">
              <p className="text-black/50">Updated just now</p>
              <button className="rounded-full bg-black px-5 py-2 text-white transition hover:bg-black/85">
                Invite member
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
