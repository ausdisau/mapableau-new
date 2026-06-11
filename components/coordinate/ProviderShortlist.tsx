"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { CoordinateConfirmDialog } from "./CoordinateShell";

type ShortlistItem = {
  id: string;
  ndisProviderId: string;
  rank: number;
  matchScore?: number | null;
  matchReason?: string | null;
  conflictFlagsJson?: unknown;
  status: string;
  providerName?: string;
};

export function ProviderShortlist({
  items,
  onReview,
}: {
  items: ShortlistItem[];
  onReview: (itemId: string, status: "approved" | "rejected") => Promise<void>;
}) {
  const [pending, setPending] = useState<{
    id: string;
    status: "approved" | "rejected";
  } | null>(null);

  return (
    <>
      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No provider suggestions yet. Generate a shortlist from your support needs.
          </p>
        ) : null}
        {items.map((item) => {
          const conflicts = Array.isArray(item.conflictFlagsJson)
            ? (item.conflictFlagsJson as string[])
            : [];
          return (
            <Card key={item.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">
                    #{item.rank} {item.providerName ?? item.ndisProviderId}
                  </CardTitle>
                  {item.matchScore != null ? (
                    <p className="text-xs text-muted-foreground">
                      Match score {Math.round(item.matchScore * 100)}%
                    </p>
                  ) : null}
                </div>
                <Badge variant="outline">{item.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.matchReason ? (
                  <p className="text-sm">{item.matchReason}</p>
                ) : null}
                {conflicts.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {conflicts.map((flag) => (
                      <Badge key={flag} variant="destructive">
                        Conflict: {flag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="default"
                    size="default"
                    className="min-h-11"
                    onClick={() =>
                      setPending({ id: item.id, status: "approved" })
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="default"
                    className="min-h-11"
                    onClick={() =>
                      setPending({ id: item.id, status: "rejected" })
                    }
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CoordinateConfirmDialog
        open={pending != null}
        title={
          pending?.status === "approved"
            ? "Approve this provider?"
            : "Reject this provider?"
        }
        description="Your choice is recorded for your support team. No booking is made automatically."
        confirmLabel={pending?.status === "approved" ? "Approve provider" : "Reject provider"}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) void onReview(pending.id, pending.status);
          setPending(null);
        }}
      />
    </>
  );
}
