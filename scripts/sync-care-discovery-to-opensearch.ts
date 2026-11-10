#!/usr/bin/env npx tsx
/**
 * Sync Care discovery candidate documents into OpenSearch (pilot design).
 * Prisma remains SoT — this script indexes public claims only.
 * Ranking criteria are participant-selected; sponsoredPlacement is always false.
 *
 * Pattern mirrors scripts/sync-service-categories-to-opensearch.ts.
 */
import { PrismaClient } from "@prisma/client";

import {
  CARE_DISCOVERY_ALIAS,
  CARE_DISCOVERY_INDEX_BODY,
  CARE_DISCOVERY_INDEX_V1,
  type CareDiscoveryDocument,
} from "@/lib/search/care-discovery-index";
import { openSearchFetch } from "@/lib/search/opensearch-client";
import { isOpenSearchConfigured } from "@/lib/config/opensearch";

const INDEX =
  process.env.OPENSEARCH_CARE_DISCOVERY_INDEX ?? CARE_DISCOVERY_INDEX_V1;
const ALIAS =
  process.env.OPENSEARCH_CARE_DISCOVERY_ALIAS ?? CARE_DISCOVERY_ALIAS;

async function ensureIndex(): Promise<void> {
  const head = await openSearchFetch(`/${INDEX}`, { method: "HEAD" });
  if (head.status === 200) {
    console.log(`Index ${INDEX} already exists.`);
    return;
  }
  const create = await openSearchFetch(`/${INDEX}`, {
    method: "PUT",
    body: JSON.stringify(CARE_DISCOVERY_INDEX_BODY),
  });
  if (!create.ok) {
    throw new Error(
      `Failed to create index ${INDEX}: ${create.status} ${await create.text()}`,
    );
  }
  console.log(`Created index ${INDEX}.`);
}

async function loadCandidateDocs(
  prisma: PrismaClient,
): Promise<CareDiscoveryDocument[]> {
  // Prefer Organisation profiles that are already public-facing.
  // Soft-fail to empty when schema fields differ in a given environment.
  try {
    const orgs = await prisma.organisation.findMany({
      take: 500,
      select: {
        id: true,
        name: true,
        updatedAt: true,
      },
    });
    const now = new Date().toISOString();
    return orgs.map((org) => ({
      candidateId: org.id,
      candidateType: "provider" as const,
      displayName: org.name,
      publicClaims: org.name,
      competencies: [],
      serviceAreas: [],
      lane: "partner" as const,
      organisationId: org.id,
      provenanceSource: "prisma.organisation",
      provenanceCheckedAt: now,
      evidenceFreshnessDays: 0,
      credentialStatus: "unknown" as const,
      sponsoredPlacement: false as const,
      updatedAt: org.updatedAt.toISOString(),
    }));
  } catch (err) {
    console.warn(
      "Could not load organisation candidates — indexing empty set.",
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

async function bulkIndex(docs: CareDiscoveryDocument[]): Promise<void> {
  if (docs.length === 0) {
    console.warn("No care discovery docs — nothing to index.");
    return;
  }
  const lines: string[] = [];
  for (const doc of docs) {
    // Hard invariant: never pay-to-rank
    if (doc.sponsoredPlacement !== false) {
      throw new Error("CARE_DISCOVERY_PAY_TO_RANK_FORBIDDEN");
    }
    lines.push(
      JSON.stringify({ index: { _index: INDEX, _id: doc.candidateId } }),
    );
    lines.push(JSON.stringify(doc));
  }
  const bulk = await openSearchFetch("/_bulk", {
    method: "POST",
    headers: { "Content-Type": "application/x-ndjson" },
    body: `${lines.join("\n")}\n`,
  });
  if (!bulk.ok) {
    throw new Error(`Bulk index failed: ${bulk.status} ${await bulk.text()}`);
  }
  const result = (await bulk.json()) as { errors?: boolean };
  if (result.errors) {
    throw new Error("Bulk index reported errors");
  }
  console.log(`Indexed ${docs.length} discovery docs into ${INDEX}.`);
}

async function ensureAlias(): Promise<void> {
  const actions = {
    actions: [
      { remove: { index: "*", alias: ALIAS } },
      { add: { index: INDEX, alias: ALIAS } },
    ],
  };
  const res = await openSearchFetch("/_aliases", {
    method: "POST",
    body: JSON.stringify(actions),
  });
  if (!res.ok) {
    console.warn(`Alias update warning: ${res.status} ${await res.text()}`);
    return;
  }
  console.log(`Alias ${ALIAS} -> ${INDEX}`);
}

async function main(): Promise<void> {
  if (!isOpenSearchConfigured()) {
    console.error("OpenSearch is not configured.");
    process.exit(1);
  }
  const prisma = new PrismaClient();
  try {
    await ensureIndex();
    const docs = await loadCandidateDocs(prisma);
    await bulkIndex(docs);
    await ensureAlias();
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
