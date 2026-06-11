"use client";

import React, { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { CoordinateAiDisclaimer, CoordinateConfirmDialog } from "./CoordinateShell";

type PlanSummary = {
  headline?: string;
  keyPoints?: string[];
  reviewNotes?: string;
};

export function PlanSummaryCard({
  summary,
  confidence,
  reason,
  requiresReview,
  status,
  onApprove,
  approving,
}: {
  summary: PlanSummary;
  confidence?: number | null;
  reason?: string | null;
  requiresReview?: boolean;
  status?: string;
  onApprove?: () => void;
  approving?: boolean;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Plan summary</CardTitle>
            {status ? (
              <Badge className="mt-2" variant="outline">
                {status}
              </Badge>
            ) : null}
          </div>
          {confidence != null ? (
            <Badge variant={requiresReview ? "destructive" : "secondary"}>
              {Math.round(confidence * 100)}% confidence
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <CoordinateAiDisclaimer confidence={confidence} reason={reason} />
          <div>
            <h3 className="font-semibold">{summary.headline ?? "Summary"}</h3>
            {summary.keyPoints?.length ? (
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm">
                {summary.keyPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            ) : null}
            {summary.reviewNotes ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {summary.reviewNotes}
              </p>
            ) : null}
          </div>
          {onApprove ? (
            <Button
              variant="default"
              size="default"
              className="min-h-11"
              onClick={() => setConfirmOpen(true)}
              disabled={approving}
            >
              Approve summary
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <CoordinateConfirmDialog
        open={confirmOpen}
        title="Approve this plan summary?"
        description="This saves the summary as your active plan reference. Nothing is sent automatically."
        confirmLabel="Yes, approve summary"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onApprove?.();
        }}
        loading={approving}
      />
    </>
  );
}
