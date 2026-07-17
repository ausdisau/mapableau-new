import Link from "next/link";

export const adminGovernanceLinks = [
  { href: "/admin/governance/systems", label: "Systems" },
  { href: "/admin/governance/appeals", label: "Appeals" },
  { href: "/admin/governance/community", label: "Community" },
  { href: "/admin/governance/aia", label: "AIA" },
];

export function AdminGovernanceNav() {
  return (
    <nav aria-label="Governance admin sections">
      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {adminGovernanceLinks.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded border p-3 text-sm hover:bg-neutral-50 focus:outline focus:outline-2"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function GovernanceAdminBoundary() {
  return (
    <section className="rounded border border-dashed border-neutral-400 bg-neutral-50 p-4 text-sm">
      <ul className="list-disc space-y-1 pl-5">
        <li>Register entry publication is not certification or endorsement.</li>
        <li>
          AIA approval is required before high-impact public register
          publication.
        </li>
        <li>
          Appeals require non-retaliation, independent review and conflict
          recusal.
        </li>
        <li>Community recommendations are advisory by default.</li>
      </ul>
    </section>
  );
}

export function ShellFormNotice({ endpoint }: { endpoint: string }) {
  return (
    <p className="text-xs text-muted-foreground">
      Shell form for operators. Submit JSON to <code>{endpoint}</code> from an
      authenticated client.
    </p>
  );
}
