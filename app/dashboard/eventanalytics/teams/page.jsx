"use client";

import "@/app/dashboard/dashboard.css";
import "@/components/events-pages.css";
import { useState } from "react";
import { DashboardEventsShell } from "@/components/DashboardEventsShell";
import { Teams } from "@/components/eventAnalytics/Teams";
import { PageHeader } from "@/components/eventAnalytics/PageHeader";
import { ExportButton } from "@/components/eventAnalytics/ExportButton";
import { INITIAL_TEAMS, SOLO_IDS } from "@/data/analytics";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TeamsPage() {
  const [teams, setTeams] = useState(INITIAL_TEAMS);
  const [solo, setSolo] = useState(SOLO_IDS);
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
            Teams
          </h1>
        </div>
      </header>
      <div className="sm:px-[10px]">
        <div className="animate-fade-up">
          <Teams teams={teams} setTeams={setTeams} solo={solo} setSolo={setSolo} />
        </div>
      </div>
    </DashboardEventsShell>
  );
}
