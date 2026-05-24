"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type ReportAdButtonProps = {
  campaignId: string;
  onHidden?: () => void;
  className?: string;
};

async function postAdAction(payload: Record<string, unknown>) {
  await fetch("/api/ads/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function ReportAdButton({
  campaignId,
  onHidden,
  className,
}: ReportAdButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  const hideAd = async () => {
    setStatus("loading");
    await postAdAction({ campaignId, actionType: "hidden" });
    setStatus("done");
    onHidden?.();
  };

  const reportAd = async () => {
    setStatus("loading");
    await postAdAction({
      campaignId,
      actionType: "reported",
      reason: "User reported misleading ad",
    });
    setStatus("done");
  };

  if (status === "done") {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Thanks — your feedback was recorded.
      </p>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={hideAd}
          disabled={status === "loading"}
        >
          Hide this ad
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={reportAd}
          disabled={status === "loading"}
        >
          Report misleading ad
        </Button>
      </div>
    </div>
  );
}
