type Props = {
  title: string;
  description: string;
  href: string;
  badge?: string;
};

export function OneServiceCard({ title, description, href, badge }: Props) {
  return (
    <a
      href={href}
      className="mo-card block p-4 transition hover:border-[var(--mo-purple)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="mo-heading text-base font-semibold">{title}</h3>
        {badge ? <span className="mo-chip mo-chip--wayfinding">{badge}</span> : null}
      </div>
      <p className="mt-2 text-sm text-[var(--mo-muted)]">{description}</p>
    </a>
  );
}
