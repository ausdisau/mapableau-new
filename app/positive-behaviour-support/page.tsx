import Link from "next/link";

import { PBS_POSITIONING } from "@/lib/positive-behaviour-support";
import { pbsConfig } from "@/lib/config/positive-behaviour-support";

export const metadata = {
  title: "Positive Behaviour Support | MapAble",
  description: PBS_POSITIONING,
};

export default function PublicPbsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-heading text-3xl font-bold">
        MapAble Positive Behaviour Support
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">{PBS_POSITIONING}</p>
      <p className="mt-4 text-sm">
        This capability is a <strong>controlled pilot</strong>. It is not
        autonomous, not clinically validated, not Commission-approved, and not a
        substitute for a suitable NDIS behaviour support practitioner.
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-6 text-sm">
        <li>AI may organise evidence and draft proposals only.</li>
        <li>
          AI must never finalise plans, determine behaviour function, or
          recommend restrictive practices.
        </li>
        <li>
          Module enabled in this environment:{" "}
          {pbsConfig.enabled ? "yes (flagged)" : "no (default off)"}.
        </li>
      </ul>
      {pbsConfig.enabled ? (
        <p className="mt-8">
          <Link
            href="/dashboard/positive-behaviour-support"
            className="inline-flex min-h-12 items-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
          >
            Open participant workspace
          </Link>
        </p>
      ) : (
        <p className="mt-8 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Feature flag <code>MAPABLE_PBS_ENABLED</code> is off. No clinical
          workspace is available.
        </p>
      )}
    </main>
  );
}
