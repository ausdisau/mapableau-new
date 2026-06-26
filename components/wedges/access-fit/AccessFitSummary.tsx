"use client";

import { AlertCircle, CheckCircle2, HelpCircle, MinusCircle } from "lucide-react";

import { accessFitLevelLabel } from "@/lib/access-fit/score";
import type { AccessFitResult } from "@/types/wedges";

type AccessFitSummaryProps = {
  result: AccessFitResult;
  showDetails?: boolean;
};

const LEVEL_ICONS = {
  strong_fit: CheckCircle2,
  possible_fit: HelpCircle,
  needs_confirmation: HelpCircle,
  likely_barrier: MinusCircle,
} as const;

const LEVEL_TONE = {
  strong_fit: "text-green-800 dark:text-green-200",
  possible_fit: "text-blue-800 dark:text-blue-200",
  needs_confirmation: "text-amber-800 dark:text-amber-200",
  likely_barrier: "text-red-800 dark:text-red-200",
} as const;

export function AccessFitSummary({ result, showDetails = true }: AccessFitSummaryProps) {
  const Icon = LEVEL_ICONS[result.level];
  const label = accessFitLevelLabel(result.level);

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-start gap-2">
        <Icon
          className={`mt-0.5 h-5 w-5 shrink-0 ${LEVEL_TONE[result.level]}`}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            Access fit: {label}{" "}
            <span className="font-normal text-muted-foreground">({result.score}/100)</span>
          </p>
          <p className="sr-only">Access fit level: {label}, score {result.score} out of 100</p>

          {result.hardBarriers.length > 0 ? (
            <p className="mt-1 flex items-start gap-1 text-sm text-red-800 dark:text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              Possible barriers identified — confirm before booking.
            </p>
          ) : null}

          {showDetails && result.details.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {result.details.map((d) => (
                <li key={d.needId}>
                  <span className="font-medium text-foreground">{d.status.replace(/_/g, " ")}:</span>{" "}
                  {d.explanation}
                </li>
              ))}
            </ul>
          ) : null}

          {result.recommendedQuestions.length > 0 && showDetails ? (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium">
                Questions to ask this provider
              </summary>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {result.recommendedQuestions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      </div>
    </div>
  );
}
