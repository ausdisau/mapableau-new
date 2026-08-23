import type { ReactNode } from "react";

import { cn } from "@/app/lib/utils";
import { SkipToContent } from "@/components/core/SkipToContent";
import {
  mapablePageContainerClass,
} from "@/lib/brand/styles";

import type { BillingNavLink } from "./billing-nav";
import { BillingSidebar } from "./BillingSidebar";

/**
 * Billing Centre page chrome: skip link, sidebar workspace nav, and main region.
 * Prefer using from the /billing layout; pages render content inside main.
 */
export function BillingShell({
  children,
  className,
  navLinks,
}: {
  children: ReactNode;
  className?: string;
  navLinks?: BillingNavLink[];
}) {
  return (
    <div className={cn(mapablePageContainerClass, "py-6", className)}>
      <SkipToContent />
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <BillingSidebar links={navLinks} />
        <div
          id="main-content"
          tabIndex={-1}
          className="min-w-0 flex-1 outline-none"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
