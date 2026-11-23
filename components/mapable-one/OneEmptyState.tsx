type Props = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function OneEmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: Props) {
  return (
    <div className="mo-card p-6 text-center" role="status">
      <h3 className="mo-heading text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[var(--mo-muted)]">{description}</p>
      {actionHref && actionLabel ? (
        <a href={actionHref} className="mo-btn-secondary mt-4 inline-flex">
          {actionLabel}
        </a>
      ) : null}
    </div>
  );
}
