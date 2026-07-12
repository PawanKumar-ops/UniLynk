"use client";

import { DashboardEventsShell } from "@/components/DashboardEventsShell";
import { MyClubsPage } from "@/components/MyClubsPage";

export default function MyClubsRoutePage() {
  return (
    <DashboardEventsShell>
      <MyClubsPage />
    </DashboardEventsShell>
  );
}
