import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import {
  getCivicFeatureFlags,
  getCivicMode,
} from "@/lib/civic-access/feature-flags";

export default async function CivicAdminHomePage() {
  await requireAdmin();
  const flags = getCivicFeatureFlags();
  const mode = getCivicMode();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">MapAble Civic</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Civic Access Infrastructure — Wave 1 asset registry and static
          accessibility projection. This is not a universal accessibility score,
          legal certificate, or public Observatory.
        </p>
      </header>

      <section
        aria-labelledby="civic-status-heading"
        className="rounded border p-4"
      >
        <h2 id="civic-status-heading" className="font-heading text-lg font-semibold">
          Operating status
        </h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Mode</dt>
            <dd>{mode}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Civic enabled</dt>
            <dd>{flags.civicEnabled ? "yes" : "no"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Asset registry</dt>
            <dd>{flags.assetRegistry ? "yes" : "no"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Public Observatory</dt>
            <dd>{flags.observatory ? "yes" : "no (Wave 1 off)"}</dd>
          </div>
        </dl>
      </section>

      <nav aria-label="Civic admin navigation">
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>
            <Link className="underline" href="/admin/civic/assets">
              Asset registry (read-only list)
            </Link>
          </li>
          <li>
            <Link className="underline" href="/admin/civic/pilot">
              Harbour precinct pilot seed
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
