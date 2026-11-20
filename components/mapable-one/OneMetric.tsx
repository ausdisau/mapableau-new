type Props = {
  label: string;
  value: string | number;
  detail?: string;
  sourceLabel?: string;
};

export function OneMetric({ label, value, detail, sourceLabel }: Props) {
  return (
    <div className="mo-card p-4">
      <p className="text-sm font-medium text-[var(--mo-muted)]">{label}</p>
      <p className="mo-heading mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {detail ? (
        <p className="mt-1 text-xs text-[var(--mo-muted)]">{detail}</p>
      ) : null}
      {sourceLabel ? (
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--mo-purple)]">
          Source: {sourceLabel}
        </p>
      ) : null}
    </div>
  );
}
