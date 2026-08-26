"use client";

import { Suspense } from "react";
import "@/app/dashboard/dashboard.css";
import "@/components/events-pages.css";
import { DashboardEventsShell } from "@/components/DashboardEventsShell";
import { Registrants } from "@/components/eventAnalytics/Registrants";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEventAnalytics } from "@/components/eventAnalytics/api";

function RegistrantsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formId = searchParams.get("formId");

  const analyticsQuery = useEventAnalytics(formId);
  const registrantsData = analyticsQuery.data?.responses || [];
  const loading = analyticsQuery.isLoading;

  if (!formId) {
    return null;
  }

  return (
    <DashboardEventsShell>
      <header
        className="sticky top-0 z-50 mb-5 flex h-[54px] w-full items-start px-4 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl"
      >
        <div className="flex h-full items-center">
          <button
            onClick={() => router.push(`/dashboard/eventanalytics${formId ? `?formId=${formId}` : ""}`)}
            className="mr-5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-black/5 cursor-pointer"
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
          {loading ? (
            <div className="py-10 text-center font-mono text-sm text-gray-500">Loading registrants...</div>
          ) : (
            <Registrants data={registrantsData} />
          )}
        </div>
      </div>
    </DashboardEventsShell>
  );
}

export default function RegistrantsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-mono">Loading registrants page...</div>}>
      <RegistrantsContent />
    </Suspense>
  );
}
