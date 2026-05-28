import { PUBLIC_LAUNCH_CHECKLIST } from "@/lib/launch-readiness/public-launch-checklist";
import type { PlatformGapCatalogEntry } from "@/lib/platform-gaps/types";

/** Platform gap rows mirrored from the full public launch checklist. */
export function buildLaunchGapCatalogEntries(): PlatformGapCatalogEntry[] {
  return PUBLIC_LAUNCH_CHECKLIST.map((item) => ({
    code: `launch.${item.code}`,
    category: "launch_ops" as const,
    title: item.title,
    description: item.description,
    severity: item.gapSeverity,
    baseline: "Full public launch",
    evidenceLinks: [
      { label: "Launch readiness", href: "/admin/launch-readiness" },
      { label: "Full public launch guide", href: "/docs/full-public-launch.md" },
    ],
    detector: "launch_item_sync" as const,
    launchItemCode: item.code,
  }));
}
