import Link from "next/link";

import { cn } from "@/app/lib/utils";
import type { CoreCapability } from "@/lib/core-ui/core-capabilities";
import { mapableSectionCardClass } from "@/lib/brand/styles";

export function CoreCapabilityStrip({ capabilities }: { capabilities: CoreCapability[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {capabilities.map((cap) => (
        <Link
          key={cap.id}
          href={cap.href}
          className={cn(
            "flex min-h-[7.5rem] flex-col rounded-xl p-4 transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            mapableSectionCardClass
          )}
        >
          <span className="font-heading text-base font-semibold">{cap.title}</span>
          <span className="mt-2 flex-1 text-sm text-muted-foreground">{cap.description}</span>
          <span className="mt-3 text-sm font-semibold text-primary">Open →</span>
        </Link>
      ))}
    </div>
  );
}
