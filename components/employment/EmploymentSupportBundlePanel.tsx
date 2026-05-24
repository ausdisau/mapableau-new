"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import type { EmploymentSupportBundleView } from "@/types/employment";

type EmploymentSupportBundlePanelProps = {
  applicationId: string;
};

export function EmploymentSupportBundlePanel({
  applicationId,
}: EmploymentSupportBundlePanelProps) {
  const [bundle, setBundle] = useState<EmploymentSupportBundleView | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch(
      `/api/job-applications/${applicationId}/linked-services`,
    );
    const d = await res.json();
    setBundle(d);
  }

  React.useEffect(() => {
    void load();
  }, [applicationId]);

  async function activate() {
    setBusy(true);
    setMessage(null);
    const res = await fetch(
      `/api/job-applications/${applicationId}/support-bundle`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
    );
    const d = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMessage(d.error ?? "Could not set up support");
      return;
    }
    setBundle(d);
    setMessage("Support bookings are ready for you to complete.");
  }

  return (
    <section className="rounded-xl border border-secondary/30 bg-secondary/5 p-4">
      <h2 className="font-heading text-lg font-semibold">Interview and work support</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Set up transport or employment support linked to this application.
      </p>
      {message ? (
        <p className="mt-2 text-sm" role="status">
          {message}
        </p>
      ) : null}
      {bundle?.transportBooking ? (
        <p className="mt-2 text-sm">
          Transport: {bundle.transportBooking.status}
        </p>
      ) : null}
      {bundle?.careRequest ? (
        <p className="mt-2 text-sm">Care support: {bundle.careRequest.status}</p>
      ) : null}
      <Button
        type="button"
        variant="default"
        size="lg"
        className="mt-4"
        disabled={busy}
        onClick={() => void activate()}
      >
        Set up support bookings
      </Button>
    </section>
  );
}
