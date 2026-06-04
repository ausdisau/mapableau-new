#!/usr/bin/env npx tsx
/**
 * Download NDIS provider finder list-providers.json for local Prisma seeding.
 *
 * The NDIA endpoint often returns 403 for non-browser clients. On failure, copy
 * public/data/provider-outlets.json manually or seed from that path directly.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import {
  NDIS_LIST_PROVIDERS_LOCAL_PATH,
  NDIS_LIST_PROVIDERS_URL,
  NDIS_LIST_PROVIDERS_URL_WWW,
} from "@/lib/ndis/list-providers-source";

const USER_AGENT =
  "Mozilla/5.0 (compatible; MapAble/1.0; +https://github.com/ausdisau/mapableau-new)";

async function tryFetch(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json, text/plain, */*",
      Referer: "https://www.ndis.gov.au/participants/working-providers/finding-providers/provider-finder",
    },
    redirect: "follow",
  });
}

async function main(): Promise<void> {
  const urls = [NDIS_LIST_PROVIDERS_URL_WWW, NDIS_LIST_PROVIDERS_URL];
  let body: string | null = null;
  let usedUrl: string | null = null;

  for (const url of urls) {
    const res = await tryFetch(url);
    if (res.ok) {
      body = await res.text();
      usedUrl = url;
      break;
    }
    console.warn(`GET ${url} → ${res.status} ${res.statusText}`);
  }

  if (!body || !usedUrl) {
    console.error(
      "Could not download list-providers.json (likely 403). Use the bundled export instead:\n" +
        "  cp public/data/provider-outlets.json data/ndis/list-providers.json\n" +
        "Then run: pnpm seed:ndis-provider-outlets",
    );
    process.exit(1);
  }

  JSON.parse(body);
  await mkdir(dirname(NDIS_LIST_PROVIDERS_LOCAL_PATH), { recursive: true });
  await writeFile(NDIS_LIST_PROVIDERS_LOCAL_PATH, body, "utf8");
  console.log(`Saved ${NDIS_LIST_PROVIDERS_LOCAL_PATH} from ${usedUrl}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
