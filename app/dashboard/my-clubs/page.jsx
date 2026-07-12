"use client";

import { DashboardEventsShell } from "@/components/DashboardEventsShell";
import { MyClubsPage } from "@/components/MyClubsPage";
import "@/app/dashboard/dashboard.css";
import "@/components/events-pages.css";

export default function MyClubsRoutePage() {
  return (
    <DashboardEventsShell>
      <MyClubsPage />
    </DashboardEventsShell>
  );
}
