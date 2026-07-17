import { redirect } from "next/navigation";

import { PlatformAssuranceShell } from "@/components/admin/platform-assurance/PlatformAssuranceShell";
import { requireAdmin } from "@/lib/auth/guards";
import { isPlatformAssuranceEnabled } from "@/lib/config/platform-assurance";
import {
  formatAuthorityClassLabel,
  listRegulatorySources,
  sourceRequiresHumanPromotion,
} from "@/lib/platform-assurance";

export const dynamic = "force-dynamic";

export default async function PlatformAssuranceSourcesPage() {
  await requireAdmin();
  if (!isPlatformAssuranceEnabled()) {
    redirect("/admin?assurance=disabled");
  }

  const sources = await listRegulatorySources();

  return (
    <PlatformAssuranceShell
      title="Regulatory and standards sources"
      description="Versioned sources with authority class. Drafts, guidance, and candidate recommendations cannot silently become enacted law."
      pathname="/admin/platform-assurance/sources"
    >
      <ul className="space-y-3">
        {sources.map((source) => (
          <li key={source.id} className="space-y-2 rounded-lg border p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold">{source.title}</h2>
              <span className="rounded border px-2 py-1 text-xs">
                {formatAuthorityClassLabel(source.authorityClass)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{source.publisher}</p>
            <p className="text-sm">{source.summary}</p>
            <dl className="grid gap-1 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Source key</dt>
                <dd className="font-mono text-xs">{source.sourceKey}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Version</dt>
                <dd>{source.versionLabel ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Retrieved</dt>
                <dd>{source.retrievedAt.toISOString().slice(0, 10)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Immutable</dt>
                <dd>{source.isImmutable ? "Yes" : "No"}</dd>
              </div>
            </dl>
            {sourceRequiresHumanPromotion(source.authorityClass) ? (
              <p className="text-sm text-amber-800 dark:text-amber-200" role="status">
                Requires human promotion before any production legal rule use.
              </p>
            ) : null}
            <p>
              <a
                href={source.sourceUri}
                className="text-sm underline underline-offset-2"
                rel="noreferrer"
                target="_blank"
              >
                Open authoritative source
              </a>
            </p>
          </li>
        ))}
      </ul>
    </PlatformAssuranceShell>
  );
}
