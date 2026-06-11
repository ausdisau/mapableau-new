"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CoordinateDashboardPayload } from "@/lib/coordinate/types";

export function CoordinationDashboard({
  dashboard,
  coordinatorParticipants = [],
  roleView,
  participantSelector,
}: {
  dashboard: CoordinateDashboardPayload;
  coordinatorParticipants?: CoordinateDashboardPayload[];
  roleView: "participant" | "coordinator" | "admin";
  participantSelector?: React.ReactNode;
}) {
  const stats = [
    { label: "Pending reviews", value: dashboard.pendingReviews },
    { label: "Draft messages", value: dashboard.pendingDrafts },
    { label: "Active risk flags", value: dashboard.activeRiskFlags },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
        {dashboard.reassurance}
      </div>

      {participantSelector}

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your next steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            Plan status:{" "}
            <Badge variant="outline">{dashboard.planStatus ?? "No plan yet"}</Badge>
          </p>
          {dashboard.budgetUsedPercent != null ? (
            <p className="text-sm">
              Budget used: {dashboard.budgetUsedPercent}% across tracked categories.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Upload or activate a plan to see budget usage.
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild variant="default" size="default" className="min-h-11">
              <Link href="/coordinate/plan">Review your plan</Link>
            </Button>
            <Button asChild variant="outline" size="default" className="min-h-11">
              <Link href="/coordinate/messages">Message drafts</Link>
            </Button>
            {roleView !== "participant" ? (
              <Button asChild variant="outline" size="default" className="min-h-11">
                <Link href="/coordinate/reviews">Open review queue</Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {roleView !== "participant" && coordinatorParticipants.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Participants you support</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {coordinatorParticipants.map((p) => (
                <li
                  key={p.participantId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{p.participantName}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.pendingReviews} reviews · {p.pendingDrafts} drafts
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="min-h-11">
                    <Link href={`/coordinate?participantId=${p.participantId}`}>
                      Open cockpit
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
