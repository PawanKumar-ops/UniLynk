"use client";

import "@/app/dashboard/dashboard.css";
import "@/components/events-pages.css";
import { useState } from "react";
import { DashboardEventsShell } from "@/components/DashboardEventsShell";
import { Teams } from "@/components/eventAnalytics/Teams";
import { PageHeader } from "@/components/eventAnalytics/PageHeader";
import { ExportButton } from "@/components/eventAnalytics/ExportButton";
import { INITIAL_TEAMS, SOLO_IDS } from "@/data/analytics";

export default function TeamsPage() {
  const [teams, setTeams] = useState(INITIAL_TEAMS);
  const [solo, setSolo] = useState(SOLO_IDS);

  return (
    <DashboardEventsShell>
        <div className="px-[14px] py-5">
      <div className="animate-fade-up">
        <PageHeader
          backTo="/dashboard/eventanalytics"
          eyebrow="Team management"
          title="Teams & roster"
          subtitle="Drag members between teams — or from the solo pool — to complete every squad."
          action={<ExportButton teams={teams} />}
        />
        <Teams teams={teams} setTeams={setTeams} solo={solo} setSolo={setSolo} />
      </div>
      </div>
    </DashboardEventsShell>
  );
}
