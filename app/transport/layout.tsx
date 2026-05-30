import { ModuleNav } from "@/components/layout/ModuleNav";
import { ModuleShell } from "@/components/layout/ModuleShell";
import { requirePermission } from "@/lib/auth/guards";

const NAV_LINKS = [
  { href: "/dashboard/transport/new", label: "New trip" },
  { href: "/dashboard/transport", label: "My trips" },
  { href: "/dashboard/find-transport", label: "Find operators" },
  { href: "/dashboard/transport/legacy", label: "Legacy bookings" },
  { href: "/driver/trips", label: "Driver view" },
];

export default async function TransportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("transport:read:self");

  return (
    <ModuleShell
      homeHref="/transport"
      homeLabel="MapAble Transport"
      navAriaLabel="Transport navigation"
      backLink={{ href: "/core", label: "MapAble Core" }}
      nav={<ModuleNav links={NAV_LINKS} />}
    >
      {children}
    </ModuleShell>
  );
}
