import Link from "next/link";

import { requirePersonalAgencyGate } from "@/lib/personal-agency/gates";

export const metadata = { title: "More | My MapAble" };

const MORE_LINKS = [
  { href: "/my/control", label: "Privacy & control" },
  { href: "/my/people", label: "My people" },
  { href: "/my/devices", label: "My devices" },
  { href: "/dashboard/billing", label: "Money & billing" },
  { href: "/dashboard/safety", label: "Safety & help" },
  { href: "/dashboard", label: "Control panel (legacy)" },
  { href: "/dashboard/accessibility", label: "Accessibility settings" },
  { href: "/account/security", label: "Account security" },
] as const;

export default async function MyMorePage() {
  await requirePersonalAgencyGate();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">More</h1>
        <p className="mt-2 text-muted-foreground">Additional My MapAble and account destinations.</p>
      </header>
      <ul className="space-y-2">
        {MORE_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#005B7F]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
