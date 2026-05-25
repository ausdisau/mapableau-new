interface OnboardingProgressProps {
  step: number;
  total: number;
  label: string;
}

export function OnboardingProgress({
  step,
  total,
  label,
}: OnboardingProgressProps) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="mb-6" aria-label={`Onboarding step ${step} of ${total}`}>
      <p className="text-sm text-slate-600 mb-2">{label}</p>
      <div
        className="h-2 w-full bg-slate-200 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuetext={`${pct}% complete`}
      >
        <div
          className="h-full bg-blue-700 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
