"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function WaitlistRequestForm() {
  const router = useRouter();
  const [serviceType, setServiceType] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/waitlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestedServiceType: serviceType,
        consentToNotifyProviders: consent,
      }),
    });
    if (!res.ok) {
      setError("Could not save waitlist request.");
      return;
    }
    router.push("/waitlists");
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      {error ? <div role="alert">{error}</div> : null}
      <label className="block">
        <span className="text-sm font-medium">Service type</span>
        <input
          required
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
          className="mt-1 min-h-11 w-full rounded-lg border px-3"
        />
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span className="text-sm">I consent to providers being notified if a match is found</span>
      </label>
      <button type="submit" className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground">
        Submit
      </button>
    </form>
  );
}
