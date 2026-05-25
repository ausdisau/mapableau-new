interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  label: string;
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
  label,
}: OnboardingProgressProps) {
  const pct = Math.round((currentStep / totalSteps) * 100);
  return (
    <div className="space-y-2" aria-label="Onboarding progress">
      <p className="text-sm text-muted-foreground">
        Step {currentStep} of {totalSteps}: {label}
      </p>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
