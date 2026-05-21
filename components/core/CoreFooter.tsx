import Link from "next/link";

import { CORE_CIVIC_LINKS } from "@/lib/core-ui/navigation";

export function CoreFooter() {
  return (
    <footer className="border-t border-border bg-card" role="contentinfo">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="font-heading font-semibold text-foreground">MapAble Core</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Disability support, transport and accountability — built with accessibility and
              consent at the centre.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Platform</p>
            <ul className="mt-2 space-y-2 text-sm">
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:text-primary">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-muted-foreground hover:text-primary">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/status" className="text-muted-foreground hover:text-primary">
                  System status
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Public & civic</p>
            <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {CORE_CIVIC_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-8 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} MapAble. Public pages show aggregate information only unless
          otherwise stated.
        </p>
      </div>
    </footer>
  );
}
