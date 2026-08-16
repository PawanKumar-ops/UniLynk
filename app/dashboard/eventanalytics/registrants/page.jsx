"use client";

import "@/app/dashboard/dashboard.css";
import "@/components/events-pages.css";
import { DashboardEventsShell } from "@/components/DashboardEventsShell";
import { Registrants } from "@/components/eventAnalytics/Registrants";
import { PageHeader } from "@/components/eventAnalytics/PageHeader";
import { ExportButton } from "@/components/eventAnalytics/ExportButton";
import { INITIAL_TEAMS } from "@/data/analytics";

export default function RegistrantsPage() {
  const teams = INITIAL_TEAMS;

  return (
    <DashboardEventsShell>
        <div className="px-[14px] py-5">
      <div className="animate-fade-up">
        <PageHeader
          backTo="/dashboard/eventanalytics"
          eyebrow="Form submissions"
          title="Registrants"
          subtitle="Everyone who filled the registration form — open a card to view their response."
          action={<ExportButton teams={teams} />}
        />
        <Registrants />
      </div>
      </div>
    </DashboardEventsShell>
  );
}
