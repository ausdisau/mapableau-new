/**
 * Public-facing workspace orientation. Navigation is not authorisation —
 * each private workspace still requires its own membership and route guards.
 */
export function OnePublicWorkspaceExplainer() {
  return (
    <section
      aria-labelledby="mo-workspace-explainer-heading"
      className="mapable-one border-y border-[var(--mo-border)] bg-[var(--mo-surface)]"
      data-testid="mapable-one-public-explainer"
    >
      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--mo-purple)]">
          MapAble One
        </p>
        <h2
          id="mo-workspace-explainer-heading"
          className="mo-heading mt-2 text-2xl font-bold"
        >
          One design. Distinct permissions.
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-[var(--mo-muted)]">
          Search is public discovery. Core, Provider and Worker are private
          workspaces — signing in does not unlock every area. Access depends on
          your verified role and organisation or worker affiliation.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Search",
              href: "/search",
              blurb: "Find places and providers with source labels.",
            },
            {
              title: "Core",
              href: "/dashboard",
              blurb: "Participant-owned choices, bookings and consent.",
            },
            {
              title: "Provider",
              href: "/provider",
              blurb: "Organisation command centre — membership required.",
            },
            {
              title: "Worker",
              href: "/worker/today",
              blurb: "Field shifts for affiliated workers only.",
            },
          ].map((item) => (
            <li key={item.title} className="mo-card p-4">
              <h3 className="mo-heading font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-[var(--mo-muted)]">{item.blurb}</p>
              <a href={item.href} className="mo-btn-secondary mt-3 inline-flex text-xs">
                Open {item.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
