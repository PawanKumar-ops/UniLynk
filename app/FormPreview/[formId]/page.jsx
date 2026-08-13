"use client";

import { useParams } from "next/navigation";
import EventPreview from "@/components/EventPreview";

export default function FormPreviewPage() {
  const params = useParams();
  const formId = params?.formId;

  return <EventPreview formId={formId} />;
}
