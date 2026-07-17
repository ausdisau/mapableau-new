import Link from "next/link";

const LINKS = [
  { suffix: "", label: "Overview" },
  { suffix: "/command", label: "Command centre" },
  { suffix: "/participants", label: "Participants" },
  { suffix: "/workers", label: "Workers" },
  { suffix: "/transactions", label: "Transactions" },
  { suffix: "/incidents", label: "Incidents" },
  { suffix: "/complaints", label: "Complaints" },
  { suffix: "/reconciliation", label: "Reconciliation" },
  { suffix: "/reviews", label: "Reviews" },
  { suffix: "/progression", label: "Progression" },
  { suffix: "/pause", label: "Pause / resume" },
  { suffix: "/closure", label: "Closure" },
] as const;

export function PilotSubnav({
  pilotId,
  current,
}: {
  pilotId: string;
  current: string;
}) {
  return (
    <nav aria-label="Pilot sections" className="flex flex-wrap gap-2 text-sm">
      {LINKS.map((link) => {
        const href = `/admin/pilot/${pilotId}${link.suffix}`;
        const active = current === link.suffix;
        return (
          <Link
            key={link.suffix || "overview"}
            href={href}
            className={
              active
                ? "rounded border border-current px-2 py-1 font-medium underline"
                : "rounded border border-transparent px-2 py-1 underline-offset-2 hover:underline"
            }
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
