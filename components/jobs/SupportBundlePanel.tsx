"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function SupportBundlePanel({
  applicationId,
  transportSupportNeeded,
  careSupportNeeded,
}: {
  applicationId: string;
  transportSupportNeeded: boolean;
  careSupportNeeded: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!transportSupportNeeded && !careSupportNeeded) return null;

  return (
    <section className="space-y-3 rounded-lg border p-4">
      <h2 className="font-heading text-lg font-semibold">Interview support</h2>
      <p className="text-sm text-muted-foreground">
        Create draft care and transport support from this application, then
        complete the details before booking.
      </p>
      {message ? (
        <p className="text-sm" role="status">
          {message}
        </p>
      ) : null}
      <Button
        type="button"
        variant="default"
        size="default"
        loading={loading}
        onClick={async () => {
          setLoading(true);
          const res = await fetch(
            `/api/job-applications/${applicationId}/support-bundle`,
            { method: "POST" },
          );
          setLoading(false);
          if (!res.ok) {
            const data = await res.json();
            setMessage(data.error ?? "Could not create support bundle");
            return;
          }
          setMessage("Support bundle created. Review linked services below.");
          router.refresh();
        }}
      >
        Complete support bundle
      </Button>
    </section>
  );
}
