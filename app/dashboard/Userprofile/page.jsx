"use client";

import { Suspense } from "react";
import { ProfilePage } from "@/components/ProfilePage";
import "@/app/dashboard/dashboard.css";

export default function UserprofilePage() {
  return <Suspense fallback={null}><ProfilePage /></Suspense>;
}
