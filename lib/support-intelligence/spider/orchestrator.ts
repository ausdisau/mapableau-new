import { auditSupportIntelligence } from "@/lib/support-intelligence/audit";
import {
  isCapabilityEnabled,
  supportIntelligenceFlags,
} from "@/lib/support-intelligence/config/feature-flags";
import { dedupeSpiderRecords } from "@/lib/support-intelligence/spider/dedupe";
import { createFixtureSpiderAdapter } from "@/lib/support-intelligence/spider/fixture-adapter";
import { createNdisDirectoryAdapter } from "@/lib/support-intelligence/spider/ndis-directory-adapter";
import { mapServicesToTaxonomy } from "@/lib/support-intelligence/spider/taxonomy";
import type {
  SourceAdapter,
  SpiderProviderRecord,
} from "@/lib/support-intelligence/spider/types";
import type {
  Provenance,
  SupportIntelligenceDenied,
} from "@/lib/support-intelligence/types";

export type SpiderDiscoveryResult =
  | {
      ok: true;
      kept: SpiderProviderRecord[];
      duplicates: number;
      excluded: number;
      taxonomyUnknown: string[];
      provenance: Provenance[];
      adapterIds: string[];
      stale: boolean;
    }
  | SupportIntelligenceDenied;

export async function runSpiderDiscovery(input?: {
  adapters?: SourceAdapter[];
  cursor?: string;
  limit?: number;
  actorUserId?: string | null;
  /** When true, include synthetic fixtures (tests / sandbox only). */
  includeFixtures?: boolean;
  ndisPayloadOverride?: unknown;
}): Promise<SpiderDiscoveryResult> {
  if (!isCapabilityEnabled("spider")) {
    return {
      ok: false,
      reasonCode: supportIntelligenceFlags.killSwitch
        ? "kill_switch"
        : "feature_flag_disabled",
      message: "MapAble Spider is disabled (fail-closed).",
    };
  }

  const adapters: SourceAdapter[] =
    input?.adapters ??
    [
      createNdisDirectoryAdapter({
        payloadOverride: input?.ndisPayloadOverride,
      }),
      ...(input?.includeFixtures ? [createFixtureSpiderAdapter()] : []),
    ];

  const all: SpiderProviderRecord[] = [];
  const provenance: Provenance[] = [];
  const adapterIds: string[] = [];

  for (const adapter of adapters) {
    const page = await adapter.fetchPage({
      pagination: { cursor: input?.cursor, limit: input?.limit ?? 100 },
    });
    all.push(...page.items);
    provenance.push(page.provenance);
    adapterIds.push(adapter.id);
  }

  const { kept, duplicates, excluded } = dedupeSpiderRecords(all);
  const taxonomyUnknown = new Set<string>();
  for (const row of kept) {
    const tax = mapServicesToTaxonomy(row.services);
    for (const u of tax.unknown) taxonomyUnknown.add(u);
  }

  const stale = provenance.some(
    (p) => p.validUntil != null && new Date(p.validUntil) < new Date(),
  );

  await auditSupportIntelligence({
    action: "support_intel.spider.run",
    actorUserId: input?.actorUserId,
    entityType: "SpiderDiscovery",
    metadata: {
      adapterIds,
      kept: kept.length,
      duplicates: duplicates.length,
      excluded: excluded.length,
      stale,
    },
  });

  return {
    ok: true,
    kept,
    duplicates: duplicates.length,
    excluded: excluded.length,
    taxonomyUnknown: [...taxonomyUnknown],
    provenance,
    adapterIds,
    stale,
  };
}
