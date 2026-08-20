"use client";

import type { RouteOption } from "@/lib/go/contracts/route-contracts";

const STEP_INSTRUCTIONS: Record<string, string> = {
  "s-central-hay": "Follow the forecourt path toward Hay Street.",
  "s-hay-elizabeth": "Continue along Hay Street toward Elizabeth Street.",
  "s-hay-george": "Head west on Hay Street toward George Street.",
  "s-george-townhall": "Proceed to Town Hall.",
  "s-townhall-pitt": "Continue north toward Pitt Street Mall.",
  "s-pitt-martin": "Follow Pitt Street toward Martin Place.",
  "s-elizabeth-hyde": "Cross toward Hyde Park — check gradient and crossing signals.",
  "s-hyde-martin": "Follow the path through Hyde Park toward Martin Place.",
  "s-hay-pitt-steep": "Alternative path with steeper gradient — review warnings.",
  "s-george-pitt-stairs": "Contains stairs — excluded unless stairs allowed.",
};

export function GoRouteSteps({
  route,
  mode,
  stepIndex,
  onStepChange,
}: {
  route: RouteOption;
  mode: "guided" | "list";
  stepIndex: number;
  onStepChange: (index: number) => void;
}) {
  const steps = route.segmentIds.map((id, i) => ({
    id,
    instruction: STEP_INSTRUCTIONS[id] ?? `Continue along segment ${id}.`,
    index: i,
  }));

  if (mode === "list") {
    return (
      <ol className="space-y-3" aria-label="Route steps">
        {steps.map((step) => (
          <li key={step.id} className="rounded-lg border p-3">
            <span className="font-medium">Step {step.index + 1}. </span>
            {step.instruction}
          </li>
        ))}
      </ol>
    );
  }

  const current = steps[stepIndex] ?? steps[0];
  if (!current) return null;

  return (
    <div aria-live="polite" aria-atomic="true" className="rounded-xl border p-6">
      <p className="text-sm text-muted-foreground">
        Step {current.index + 1} of {steps.length}
      </p>
      <p className="mt-2 text-lg font-medium">{current.instruction}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="min-h-11 rounded-lg border px-4"
          disabled={stepIndex <= 0}
          onClick={() => onStepChange(Math.max(0, stepIndex - 1))}
        >
          Previous
        </button>
        <button
          type="button"
          className="min-h-11 rounded-lg border px-4"
          disabled={stepIndex >= steps.length - 1}
          onClick={() => onStepChange(Math.min(steps.length - 1, stepIndex + 1))}
        >
          Next
        </button>
        <button
          type="button"
          className="min-h-11 rounded-lg border px-4"
          onClick={() => onStepChange(stepIndex)}
        >
          Repeat instruction
        </button>
      </div>
    </div>
  );
}

export function GoListView(props: Parameters<typeof GoRouteSteps>[0]) {
  return <GoRouteSteps {...props} mode="list" />;
}
