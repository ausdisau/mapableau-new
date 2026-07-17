import Link from "next/link";

import { PLATFORM_ASSURANCE_DISCLAIMER } from "@/lib/config/platform-assurance";
import { cn } from "@/app/lib/utils";

const NAV = [
  { href: "/admin/platform-assurance", label: "Overview" },
  { href: "/admin/platform-assurance/sources", label: "Sources" },
  { href: "/admin/platform-assurance/scope", label: "Scope" },
  { href: "/admin/platform-assurance/controls", label: "Controls" },
  { href: "/admin/platform-assurance/workers", label: "Worker gaps" },
];

export function PlatformAssuranceShell({
  title,
  description,
  pathname,
  children,
}: {
  title: string;
  description?: string;
  pathname: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <Link href="/admin" className="underline-offset-2 hover:underline">
            Admin
          </Link>
          {" / "}
          Platform assurance
        </p>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-muted-foreground">{description}</p>
        ) : null}
        <aside
          className="rounded-md border border-amber-700/40 bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-50"
          role="note"
        >
          {PLATFORM_ASSURANCE_DISCLAIMER}
        </aside>
      </header>

      <nav aria-label="Platform assurance sections">
        <ul className="flex flex-wrap gap-2">
          {NAV.map((item) => {
            const active =
              item.href === "/admin/platform-assurance"
                ? pathname === item.href
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-md border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background hover:bg-muted"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {children}
    </div>
  );
}
