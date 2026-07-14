"use client";

import { Suspense } from "react";
import { ClubPage } from "@/components/ClubProfile";
import "@/app/dashboard/dashboard.css";
import "@/components/events-pages.css";

export default function Clubpage() {
  return (
    <Suspense fallback={null}>
      <ClubPage />
    </Suspense>
  );
}
