import type { ReactNode } from "react";

import { OnboardingProgress } from "@/components/registration/OnboardingProgress";

interface OnboardingShellProps {
  title: string;
  description: string;
  children: ReactNode;
  step?: number;
  totalSteps?: number;
  stepLabel?: string;
  statusMessage?: string;
}

export function OnboardingShell({
  title,
  description,
  children,
  step = 1,
  totalSteps = 3,
  stepLabel = "Details",
  statusMessage,
}: OnboardingShellProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">MapAble onboarding</p>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-base text-muted-foreground">{description}</p>
      </header>
      <OnboardingProgress
        currentStep={step}
        totalSteps={totalSteps}
        label={stepLabel}
      />
      {statusMessage ? (
        <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
          {statusMessage}
        </p>
      ) : null}
      {children}
    </div>
  );
}
