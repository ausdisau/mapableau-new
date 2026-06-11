"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const severityLabel: Record<string, string> = {
  low: "Low severity",
  medium: "Medium severity",
  high: "High severity",
  critical: "Critical severity",
};

const severityClass: Record<string, string> = {
  low: "border-slate-300 bg-slate-50",
  medium: "border-amber-300 bg-amber-50",
  high: "border-orange-400 bg-orange-50",
  critical: "border-red-500 bg-red-50",
};

type RiskFlag = {
  id: string;
  code: string;
  severity: string;
  summary: string;
  reason?: string | null;
  confidence?: number | null;
};

export function RiskFlagCard({ flag }: { flag: RiskFlag }) {
  const label = severityLabel[flag.severity] ?? flag.severity;
  const className = severityClass[flag.severity] ?? severityClass.medium;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <CardTitle className="text-base">{flag.summary}</CardTitle>
        <Badge variant="outline" aria-label={label}>
          {label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          <span className="font-medium">Code:</span> {flag.code}
        </p>
        {flag.reason ? <p>{flag.reason}</p> : null}
        {flag.confidence != null ? (
          <p className="text-xs text-muted-foreground">
            Confidence {Math.round(flag.confidence * 100)}%
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
