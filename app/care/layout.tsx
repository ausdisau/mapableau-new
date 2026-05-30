import { ModuleNav } from "@/components/layout/ModuleNav";
import { ModuleShell } from "@/components/layout/ModuleShell";
import { requirePermission } from "@/lib/auth/guards";

const NAV_LINKS = [
  { href: "/care/request", label: "Request care" },
  { href: "/care/bookings", label: "Bookings" },
  { href: "/care/service-logs", label: "Service logs" },
  { href: "/care/shifts", label: "Shifts" },
  { href: "/care/find", label: "Find providers" },
];

export default async function CareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("care:read:self");

  return (
    <ModuleShell
      homeHref="/care"
      homeLabel="MapAble Care"
      navAriaLabel="Care navigation"
      backLink={{ href: "/dashboard", label: "Dashboard" }}
      nav={<ModuleNav links={NAV_LINKS} />}
    >
      {children}
    </ModuleShell>
  );
}
