"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { triggerNdisProviderIngestion } from "./actions";

export function NdisIngestionClient() {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="default"
        size="lg"
        className="min-h-12"
        loading={loading}
        onClick={async () => {
          setLoading(true);
          setStatus("Running ingestion…");
          try {
            const result = await triggerNdisProviderIngestion();
            if (result.ok) {
              setStatus(
                `Success: ${result.providerCount} providers upserted in ${result.durationMs}ms.`,
              );
            } else {
              setStatus(result.error ?? "Ingestion failed.");
            }
          } catch {
            setStatus("Ingestion failed. Check server logs.");
          } finally {
            setLoading(false);
          }
        }}
      >
        Run ingestion now
      </Button>
      {status ? (
        <p role="status" aria-live="polite" className="text-sm">
          {status}
        </p>
      ) : null}
    </div>
  );
}
