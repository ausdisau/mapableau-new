import type { ActionCentreProjection } from "@/lib/mapable-one/action-centre";
import { OneEmptyState } from "@/components/mapable-one/OneEmptyState";
import { OneStatus } from "@/components/mapable-one/OneStatus";

type Props = {
  title?: string;
  projection: ActionCentreProjection;
};

export function OneActionCentre({
  title = "Action Centre",
  projection,
}: Props) {
  if (projection.state === "unavailable") {
    return (
      <section aria-labelledby="mo-action-centre-heading" className="space-y-3">
        <h2 id="mo-action-centre-heading" className="mo-heading text-lg font-semibold">
          {title}
        </h2>
        <OneEmptyState
          title="Not available"
          description={
            projection.message ??
            "This Action Centre cannot load for your current membership."
          }
        />
      </section>
    );
  }

  if (projection.state === "empty") {
    return (
      <section aria-labelledby="mo-action-centre-heading" className="space-y-3">
        <h2 id="mo-action-centre-heading" className="mo-heading text-lg font-semibold">
          {title}
        </h2>
        <OneEmptyState
          title="Nothing needs you right now"
          description={
            projection.message ??
            "Authorised actions will appear here when they are available."
          }
        />
      </section>
    );
  }

  return (
    <section aria-labelledby="mo-action-centre-heading" className="space-y-3">
      <h2 id="mo-action-centre-heading" className="mo-heading text-lg font-semibold">
        {title}
      </h2>
      <ul className="space-y-2">
        {projection.items.map((item) => (
          <li key={item.id} className="mo-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <OneStatus tone={item.urgency} label={item.urgency} />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--mo-muted)]">
                {item.sourceLabel}
              </span>
            </div>
            <h3 className="mo-heading mt-2 text-base font-semibold">
              {item.href ? (
                <a href={item.href} className="underline-offset-2 hover:underline">
                  {item.title}
                </a>
              ) : (
                item.title
              )}
            </h3>
            <p className="mt-1 text-sm text-[var(--mo-muted)]">{item.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
