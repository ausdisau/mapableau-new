import React from "react";

import { cn } from "@/app/lib/utils";
import type { ProviderOnboardingStepId } from "@/types/provider-onboarding";
import { STEP_ORDER } from "@/lib/provider-onboarding/provider-onboarding-service";

const STEP_LABELS: Record<ProviderOnboardingStepId, string> = {
  organisation: "Organisation",
  regions: "Regions",
  ndis: "NDIS",
  insurance: "Insurance",
  review: "Review",
};

type OnboardingStepperProps = {
  currentStep: ProviderOnboardingStepId;
  completedSteps: ProviderOnboardingStepId[];
};

export function OnboardingStepper({
  currentStep,
  completedSteps,
}: OnboardingStepperProps) {
  return (
    <nav aria-label="Onboarding progress" className="mb-8">
      <ol className="flex flex-wrap gap-2 sm:gap-4">
        {STEP_ORDER.map((step, index) => {
          const done = completedSteps.includes(step);
          const active = step === currentStep;
          return (
            <li
              key={step}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium",
                active && "border-primary bg-primary/10 text-primary",
                done && !active && "border-border bg-muted/40 text-foreground",
                !done && !active && "border-border/60 text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  active && "bg-primary text-primary-foreground",
                  done && !active && "bg-secondary text-secondary-foreground",
                  !done && !active && "bg-muted text-muted-foreground",
                )}
                aria-hidden
              >
                {done ? "✓" : index + 1}
              </span>
              <span>{STEP_LABELS[step]}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
