import Link from "next/link";

import { cn } from "@/app/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CoreServicePillar } from "@/lib/core-ui/pillars";
import { mapableSectionCardClass } from "@/lib/brand/styles";

import { CoreRoadmapBadge } from "./CoreRoadmapBadge";

export function CorePillarCard({ pillar }: { pillar: CoreServicePillar }) {
  return (
    <Card className={cn("flex h-full flex-col", mapableSectionCardClass)}>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="font-heading text-lg">{pillar.name}</CardTitle>
          <CoreRoadmapBadge variant="live" />
        </div>
        <p className="text-sm font-medium text-primary">{pillar.tagline}</p>
        <CardDescription>{pillar.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto flex flex-col gap-3">
        <Link
          href={pillar.primaryHref}
          className="inline-flex min-h-10 w-fit items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {pillar.primaryLabel}
        </Link>
        {pillar.secondaryLinks.length > 0 ? (
          <ul className="flex flex-col gap-1 border-t border-border/60 pt-3">
            {pillar.secondaryLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-10 items-center text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm"
                >
                  {link.label}
                </Link>
                {link.description ? (
                  <span className="ml-1 text-xs text-muted-foreground">— {link.description}</span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
