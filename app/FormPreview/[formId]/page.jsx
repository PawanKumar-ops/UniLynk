"use client";

import { useParams, useSearchParams } from "next/navigation";
import EventPreview from "@/components/EventPreview";

export default function FormPreviewPage() {
  const params = useParams();
  const formId = params?.formId;
  const responseId = useSearchParams().get("responseId");

  return <EventPreview formId={formId} responseId={responseId} />;
}
