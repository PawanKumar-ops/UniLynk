import { useEffect, useState } from "react";
import { Check, Globe, Lock, ChevronDown, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function PublishCard({ open, clubs, onPublish }) {
  const [audience, setAudience] = useState("members");
  const [clubId, setClubId] = useState(clubs[0]?.id ?? "");
  const [clubOpen, setClubOpen] = useState(false);

  useEffect(() => {
    if (!clubId && clubs[0]?.id) {
      setClubId(clubs[0].id);
    }
  }, [clubs, clubId]);

  const selectedClub = clubs.find((c) => c.id === clubId);
  const multipleClubs = clubs.length > 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="absolute right-0 top-full mt-3 w-[360px] z-50"
        >
          <div className="relative rounded-2xl bg-white border border-neutral-200/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.18),0_8px_20px_-10px_rgba(0,0,0,0.1)] overflow-hidden">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-100/60 to-transparent blur-2xl pointer-events-none" />

            <div className="relative px-5 pt-5 pb-4">
              <div className="flex items-center gap-2 mb-1">
                
                <span className="text-[15px] font-semibold text-neutral-900">Publish form</span>
              </div>
              <p className="text-xs text-neutral-500">Choose where this form goes live.</p>
            </div>

            {multipleClubs && (
              <div className="relative px-5 pb-4">
                <label className="block text-[11px] font-medium uppercase tracking-wider text-neutral-400 mb-2">
                  Publish as
                </label>
                <div className="relative">
                <button
                  type="button"
                  onClick={() => setClubOpen((o) => !o)}
                  className="w-full flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 hover:bg-neutral-50 px-3 py-2.5 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 shrink-0 rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-600 flex items-center justify-center text-white text-xs font-semibold">
                      {selectedClub?.name.charAt(0)}
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="text-sm font-medium text-neutral-900 truncate">
                        {selectedClub?.name}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {selectedClub?.members.toLocaleString()} members
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-neutral-400 transition-transform ${
                      clubOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {clubOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute left-0 right-0 top-full mt-1.5 z-20 rounded-xl border border-neutral-200 bg-white shadow-[0_12px_32px_-8px_rgba(0,0,0,0.18)] p-1 max-h-56 overflow-y-auto"
                    >
                      {clubs.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setClubId(c.id);
                            setClubOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-neutral-50 transition-colors"
                        >
                          <div className="h-7 w-7 shrink-0 rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-600 flex items-center justify-center text-white text-xs font-semibold">
                            {c.name.charAt(0)}
                          </div>
                          <div className="min-w-0 text-left flex-1">
                            <div className="text-sm font-medium text-neutral-900 truncate">
                              {c.name}
                            </div>
                            <div className="text-[11px] text-neutral-500">
                              {c.members.toLocaleString()} members
                            </div>
                          </div>
                          {c.id === clubId && <Check className="h-4 w-4 text-neutral-900" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                </div>
              </div>
            )}

            <div className="px-5 pb-4">
              <label className="block text-[11px] font-medium uppercase tracking-wider text-neutral-400 mb-2">
                Visible to
              </label>
              <div className="grid grid-cols-2 gap-2">
                <AudienceOption
                  active={audience === "members"}
                  onClick={() => setAudience("members")}
                  icon={<Lock className="h-4 w-4" />}
                  title="Club members"
                  subtitle="Private"
                />
                <AudienceOption
                  active={audience === "everyone"}
                  onClick={() => setAudience("everyone")}
                  icon={<Globe className="h-4 w-4" />}
                  title="Everyone"
                  subtitle="Public link"
                />
              </div>
            </div>

            <div className="px-5 pb-5 pt-1">
              <button
                onClick={() => onPublish(audience, clubId)}
                disabled={!clubId}
                className="w-full rounded-xl bg-neutral-900 enabled:hover:bg-neutral-800 enabled:active:bg-black disabled:bg-neutral-400 text-white text-sm font-medium py-2.5 transition-colors shadow-[0_4px_12px_-2px_rgba(0,0,0,0.25)] disabled:cursor-not-allowed"
              >
                Publish form
              </button>
              <p className="text-[11px] text-neutral-400 text-center mt-2.5">
                You can change these settings anytime.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AudienceOption({ active, onClick, icon, title, subtitle }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all ${
        active
          ? "border-neutral-900 bg-neutral-900/[0.03] shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
          : "border-neutral-200 hover:border-neutral-300 bg-white"
      }`}
    >
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-lg ${
          active ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700"
        }`}
      >
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium text-neutral-900">{title}</div>
        <div className="text-[11px] text-neutral-500">{subtitle}</div>
      </div>
      {active && (
        <div className="absolute top-2.5 right-2.5 h-4 w-4 rounded-full bg-neutral-900 flex items-center justify-center">
          <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
        </div>
      )}
    </button>
  );
}
