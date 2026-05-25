export function FormStepHeader({
  step,
  total,
  title,
}: {
  step: number;
  total: number;
  title: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Step {step} of {total}
      </p>
      <h2 className="font-heading text-lg font-bold">{title}</h2>
    </div>
  );
}
