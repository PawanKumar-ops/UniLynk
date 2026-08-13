"use client";

import { useParams } from "next/navigation";
import EventBuilder from "@/components/EventBuilder";

export default function FormBuilderPage() {
  const params = useParams();
  const formId = params?.formId;

  return <EventBuilder formId={formId} />;
}
