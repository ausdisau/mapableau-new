#!/usr/bin/env npx tsx
/**
 * Sync Care blueprint requirement chunks into OpenSearch (eng/internal index).
 * Uses repo OpenSearch client — no Opensearch-mcp-server dependency.
 *
 * Requires OPENSEARCH_ENABLED=true and credentials.
 */
import {
  CARE_BLUEPRINT_INDEX_BODY,
  CARE_BLUEPRINT_INDEX_V1,
  CARE_BLUEPRINT_SEED_CHUNKS,
} from "@/lib/search/care-blueprint-index";
import { openSearchFetch } from "@/lib/search/opensearch-client";
import { isOpenSearchConfigured } from "@/lib/config/opensearch";

const INDEX =
  process.env.OPENSEARCH_CARE_BLUEPRINT_INDEX ?? CARE_BLUEPRINT_INDEX_V1;

async function ensureIndex(): Promise<void> {
  const head = await openSearchFetch(`/${INDEX}`, { method: "HEAD" });
  if (head.status === 200) {
    console.log(`Index ${INDEX} already exists.`);
    return;
  }
  const create = await openSearchFetch(`/${INDEX}`, {
    method: "PUT",
    body: JSON.stringify(CARE_BLUEPRINT_INDEX_BODY),
  });
  if (!create.ok) {
    throw new Error(
      `Failed to create index ${INDEX}: ${create.status} ${await create.text()}`,
    );
  }
  console.log(`Created index ${INDEX}.`);
}

async function bulkIndex(): Promise<void> {
  const lines: string[] = [];
  for (const doc of CARE_BLUEPRINT_SEED_CHUNKS) {
    const id = `${doc.docId}:${doc.sectionId}`;
    lines.push(JSON.stringify({ index: { _index: INDEX, _id: id } }));
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
  console.log(`Indexed ${CARE_BLUEPRINT_SEED_CHUNKS.length} blueprint chunks into ${INDEX}.`);
}

async function smokeQuery(): Promise<void> {
  const res = await openSearchFetch(`/${INDEX}/_search`, {
    method: "POST",
    body: JSON.stringify({
      size: 3,
      query: {
        multi_match: {
          query: "no auto-assignment participant decision",
          fields: ["sectionTitle^3", "content^2", "invariants^4"],
        },
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Smoke query failed: ${res.status} ${await res.text()}`);
  }
  const body = (await res.json()) as {
    hits?: { hits?: Array<{ _id: string }> };
  };
  const ids = (body.hits?.hits ?? []).map((h) => h._id);
  console.log(`Smoke query hits: ${ids.join(", ") || "(none)"}`);
}

async function main(): Promise<void> {
  if (!isOpenSearchConfigured()) {
    console.error(
      "OpenSearch is not configured. Set OPENSEARCH_ENABLED=true and credentials.",
    );
    process.exit(1);
  }
  await ensureIndex();
  await bulkIndex();
  await smokeQuery();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
