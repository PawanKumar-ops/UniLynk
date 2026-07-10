"use client";

import { useRouter } from "next/navigation";
import { Search, ChevronLeft } from "lucide-react";

export function TopBar({ showBack = false }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3">
      {showBack && (
        <button
          onClick={() => router.push("./")}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#0000001A] text-[#717182] transition-colors hover:bg-neutral-100"
        >
          <ChevronLeft className="h-[18px] w-[18px]" />
        </button>
      )}

      <div className="relative flex-1">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />

        <input
          type="text"
          placeholder="Search students, clubs, events..."
          data-slot="input"
          className="w-full pl-11 pr-4 py-3 rounded-full bg-neutral-100 border border-transparent focus:bg-white focus:border-neutral-300 outline-none text-sm transition"
        />
      </div>
    </div>
  );
}