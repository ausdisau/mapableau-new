import { MapPin } from "lucide-react";
import Link from "next/link";

import { CORE_PLATFORM_LINKS } from "@/lib/core-ui/navigation";

export function CoreFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50" role="contentinfo">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary p-1.5">
                <MapPin className="h-5 w-5 fill-white text-white" aria-hidden />
              </div>
              <span className="font-heading text-lg font-bold text-primary">MapAble</span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Enabling people with disabilities to live independent and dignified lives through
              innovative technology in care, transport, and employment.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Platform</p>
            <ul className="mt-3 space-y-2 text-sm">
              {CORE_PLATFORM_LINKS.filter((l) => l.href !== "/login").map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-8 border-t border-slate-200 pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} MapAble. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
