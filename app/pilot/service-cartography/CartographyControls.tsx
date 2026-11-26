"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CARTOGRAPHY_FAILURE_MODES } from "@/lib/pilot/service-cartography/types";

export function CartographyControls() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function run(failureMode?: string) {
    setLoading(true);
    setResult("");
    const url = failureMode
      ? `/api/pilot/service-cartography/simulate?failureMode=${encodeURIComponent(failureMode)}`
      : "/api/pilot/service-cartography/simulate";
    try {
      const res = await fetch(url);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult(body.error ?? "Simulate failed");
        return;
      }
      const state = body.state as {
        blocked: boolean;
        blockReason?: string;
        failureMode?: string;
        matching: { status: string; ranked: unknown[] };
        isBooking: boolean;
        autoAssignment: boolean;
        notices: string[];
      };
      setResult(
        JSON.stringify(
          {
            blocked: state.blocked,
            blockReason: state.blockReason,
            failureMode: state.failureMode,
            matchingStatus: state.matching.status,
            ranked: state.matching.ranked.length,
            isBooking: state.isBooking,
            autoAssignment: state.autoAssignment,
            notices: state.notices.slice(-3),
          },
          null,
          2,
        ),
      );
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Simulate failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby="controls-heading" className="space-y-3">
      <h2 id="controls-heading" className="text-lg font-semibold">
        Failure variants (synthetic simulate)
      </h2>
      <p className="text-sm text-muted-foreground">
        These buttons only re-run the advisory engine. They cannot book, pay,
        assign a worker, or submit an NDIS claim.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="default"
          size="default"
          disabled={loading}
          onClick={() => void run()}
          data-testid="run-baseline-simulate"
        >
          Run baseline simulate
        </Button>
        {CARTOGRAPHY_FAILURE_MODES.map((mode) => (
          <Button
            key={mode}
            type="button"
            variant="outline"
            size="default"
            disabled={loading}
            onClick={() => void run(mode)}
            data-testid={`run-failure-${mode}`}
          >
            {mode.replaceAll("_", " ")}
          </Button>
        ))}
      </div>
      {result ? (
        <pre
          className="overflow-x-auto rounded-md border bg-muted/40 p-3 text-xs"
          data-testid="simulate-result"
        >
          {result}
        </pre>
      ) : null}
    </section>
  );
}
