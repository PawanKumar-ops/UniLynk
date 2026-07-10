"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { NewsLetterCard } from "@/components/NewsLetterCard";

export function DashboardEventsShell({ children }) {
  const router = useRouter();

  return (
    <div className="homebody events-page-shell">
      <main className="dashmain events-design-main">
        <div className="feed events-design-feed">
          <div className="events-design-content">{children}</div>
        </div>
      </main>

      <div className="msgsidebar">
        <div className="msgsidebarmain">
          <button
            type="button"
            onClick={() => router.push("/dashboard/explore")}
            className="w-[325px] h-[54px] rounded-2xl border border-neutral-200 backdrop-blur-md flex items-center justify-center gap-2 text-[16px] font-semibold shadow-sm transition-all duration-300 bg-white/90 text-neutral-900 hover:bg-[#fbfbfb]"
          >
            <span>Explore Campus</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <hr className="mt-4 mb-4" />
          <NewsLetterCard />
        </div>
      </div>
    </div>
  );
}
