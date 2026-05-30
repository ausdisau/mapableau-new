import Link from "next/link";

import { CoreShell } from "@/components/core/CoreShell";
import { CorePageHeader } from "@/components/core/CorePageHeader";

export const metadata = {
  title: "Coming soon | MapAble",
};

export function ModuleComingSoonPage({
  moduleName,
  description,
}: {
  moduleName: string;
  description: string;
}) {
  return (
    <CoreShell>
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
        <CorePageHeader
          eyebrow="MapAble"
          title={moduleName}
          description={description}
        />
        <p className="text-muted-foreground">
          This module is not available in the web app yet. You can still use MapAble
          Care, Transport, and Jobs from the platform hub.
        </p>
        <Link
          href="/core"
          className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          Back to MapAble Core
        </Link>
      </div>
    </CoreShell>
  );
}
