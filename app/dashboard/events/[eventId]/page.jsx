"use client";

import { useParams } from "next/navigation";
import EventDetails from "@/components/EventDetails";
import { DashboardEventsShell } from "@/components/DashboardEventsShell";
import "@/app/dashboard/dashboard.css";

export default function EventDetailsPage() {
  const { eventId } = useParams();

  return (
    <DashboardEventsShell>
      <EventDetails eventId={eventId} />
    </DashboardEventsShell>
  );
}
