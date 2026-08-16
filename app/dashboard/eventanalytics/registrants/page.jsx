"use client";

import "@/app/dashboard/dashboard.css";
import "@/components/events-pages.css";
import { DashboardEventsShell } from "@/components/DashboardEventsShell";
import { Registrants } from "@/components/eventAnalytics/Registrants";
import { PageHeader } from "@/components/eventAnalytics/PageHeader";
import { ExportButton } from "@/components/eventAnalytics/ExportButton";
import { INITIAL_TEAMS } from "@/data/analytics";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function RegistrantsPage() {
  const teams = INITIAL_TEAMS;
  const router = useRouter();

  return (
    <DashboardEventsShell>
      <header
        className="sticky top-0 z-50 mb-5 flex h-[54px] w-full items-start px-4 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl"
      >
        <div className="flex h-full items-center">
          <button
            onClick={() => router.push("/dashboard/eventanalytics")}
            className="mr-5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-black/5"
          >
            <ArrowLeft size={20} strokeWidth={2.2} />
          </button>

          <h1 className="m-0 whitespace-nowrap text-[20px] font-bold leading-[54px] text-black">
            Registrants
          </h1>
        </div>
      </header>
      <div className="sm:px-[10px]">
        <div className="animate-fade-up">
          <Registrants />
        </div>
      </div>
    </DashboardEventsShell>
  );
}
