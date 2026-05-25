"use client";

import { useCallback, useEffect, useState } from "react";

import { WwcStatusCard } from "@/components/verification/wwc/WwcStatusCard";
import { WwcSubmissionForm } from "@/components/verification/wwc/WwcSubmissionForm";

type MeResponse = {
  publicBadge: { label: string; status: string | null };
  verifications: {
    status: string;
    jurisdiction: string;
    checkType: string;
    expiresAt: string | null;
  }[];
};

export default function WorkerWwcVerificationPage() {
  const [data, setData] = useState<MeResponse | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/verification/wwc/me");
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Could not load verification status");
      return;
    }
    setData(json);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const latest = data?.verifications[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <header>
        <h1 className="font-heading text-2xl font-bold">
          Working With Children Check
        </h1>
        <p className="mt-2 text-muted-foreground">
          Submit your state or territory child-related check for MapAble review before providing child-related supports.
        </p>
      </header>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {data ? (
        <WwcStatusCard
          status={latest?.status ?? data.publicBadge.status}
          publicLabel={data.publicBadge.label}
          expiresAt={latest?.expiresAt}
          jurisdiction={latest?.jurisdiction}
          checkType={latest?.checkType}
        />
      ) : null}

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold">Submit or update</h2>
        <div className="mt-4">
          <WwcSubmissionForm onSubmitted={load} />
        </div>
      </section>
    </div>
  );
}
