import Link from "next/link";

import { cn } from "@/app/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { CoreRoadmapBadge, type CoreRoadmapBadgeVariant } from "./CoreRoadmapBadge";

export type CoreHubCardStatus = "live" | "roadmap";

export function CoreHubCard({
  href,
  title,
  description,
  status = "live",
  badge,
}: {
  href?: string;
  title: string;
  description?: string;
  status?: CoreHubCardStatus;
  badge?: CoreRoadmapBadgeVariant;
}) {
  const isRoadmap = status === "roadmap" || !href;
  const badgeVariant: CoreRoadmapBadgeVariant = badge ?? (isRoadmap ? "roadmap" : "live");

  const card = (
    <Card
      variant="gradient"
      className={cn(
        "h-full",
        isRoadmap && "opacity-95 shadow-sm ring-1 ring-border/60"
      )}
    >
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          <CoreRoadmapBadge variant={badgeVariant} />
        </div>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        {isRoadmap ? (
          <span className="text-sm text-muted-foreground">Planned — not available yet</span>
        ) : (
          <span className="text-sm font-semibold text-primary">Open →</span>
        )}
      </CardContent>
    </Card>
  );

  if (isRoadmap) {
    return (
      <div
        className="block h-full rounded-xl"
        aria-disabled="true"
        tabIndex={-1}
      >
        {card}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {card}
    </Link>
  );
}
