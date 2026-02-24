"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PublishFormPage() {
  const { formld } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!formld) return;

    const publishForm = async () => {
      try {
        // STEP 1 — Get latest form data
        const formRes = await fetch(`/api/forms/${formld}`);
        if (!formRes.ok) throw new Error("Failed to load form");
        const formData = await formRes.json();

        // STEP 2 — Save updated form content
        const { _id, ...safeData } = formData;
        const updateRes = await fetch("/api/forms/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formId: _id || formld,
            formData: safeData,
          }),
        });

        if (!updateRes.ok) throw new Error("Failed to update form");

        // STEP 3 — Publish form
          const publishRes = await fetch("/api/forms/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formId: _id || formld }),
        });

        if (!publishRes.ok) throw new Error("Failed to publish form");

        router.push("/dashboard/events");
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    publishForm();

  }, [formld, router]);

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      {loading ? "Publishing Form..." : "Done"}
    </div>
  );
}