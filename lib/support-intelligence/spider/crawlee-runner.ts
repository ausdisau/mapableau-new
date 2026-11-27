import { supportIntelligenceFlags } from "@/lib/support-intelligence/config/feature-flags";
import { buildProvenance } from "@/lib/support-intelligence/provenance";
import { checkDistributedRateLimit } from "@/lib/support-intelligence/rate-limit";
import {
  DEFAULT_CRAWL_ALLOWLIST,
  findAllowlistEntry,
  isPathDisallowedByRobots,
} from "@/lib/support-intelligence/spider/crawl-allowlist";
import type { CrawlAllowlistEntry } from "@/lib/support-intelligence/spider/types";
import type { Provenance } from "@/lib/support-intelligence/types";

export type CrawlPageResult = {
  url: string;
  status: number;
  title: string | null;
  textExcerpt: string;
  allowed: boolean;
  denialReason?: string;
  provenance: Provenance;
  engine: "crawlee" | "fetch_compat";
};

async function fetchRobots(origin: string, signal?: AbortSignal): Promise<string> {
  try {
    const res = await fetch(`${origin}/robots.txt`, {
      headers: {
        "User-Agent": "MapAble-Spider/0.1 (+https://mapable.com.au)",
      },
      signal,
    });
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  }
}

async function fetchCompatPage(
  url: string,
  signal?: AbortSignal,
): Promise<CrawlPageResult> {
  const entry = findAllowlistEntry(url);
  if (!entry) {
    return {
      url,
      status: 0,
      title: null,
      textExcerpt: "",
      allowed: false,
      denialReason: "host_or_path_not_allowlisted",
      provenance: buildProvenance({
        sourceKind: "approved_crawl",
        sourceUrl: url,
        raw: { denied: true },
      }),
      engine: "fetch_compat",
    };
  }

  const parsed = new URL(url);
  const robots = await fetchRobots(parsed.origin, signal);
  if (entry.robotsRequired && isPathDisallowedByRobots(robots, parsed.pathname)) {
    return {
      url,
      status: 0,
      title: null,
      textExcerpt: "",
      allowed: false,
      denialReason: "robots_disallow",
      provenance: buildProvenance({
        sourceKind: "approved_crawl",
        sourceUrl: url,
        raw: { robotsDisallow: true },
      }),
      engine: "fetch_compat",
    };
  }

  const rl = await checkDistributedRateLimit(`spider:crawl:${parsed.host}`, {
    windowMs: 60_000,
    max: entry.maxPagesPerRun,
  });
  if (!rl.allowed) {
    return {
      url,
      status: 429,
      title: null,
      textExcerpt: "",
      allowed: false,
      denialReason: "rate_limited",
      provenance: buildProvenance({
        sourceKind: "approved_crawl",
        sourceUrl: url,
        raw: { rateLimited: true },
      }),
      engine: "fetch_compat",
    };
  }

  const res = await fetch(url, {
    headers: {
      "User-Agent": "MapAble-Spider/0.1 (+https://mapable.com.au)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "manual",
    signal,
  });

  if (res.status >= 300 && res.status < 400) {
    return {
      url,
      status: res.status,
      title: null,
      textExcerpt: "",
      allowed: false,
      denialReason: "redirect_not_followed",
      provenance: buildProvenance({
        sourceKind: "approved_crawl",
        sourceUrl: url,
        raw: { location: res.headers.get("location") },
      }),
      engine: "fetch_compat",
    };
  }

  const html = (await res.text()).slice(0, 200_000);
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const textExcerpt = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2000);

  return {
    url,
    status: res.status,
    title: titleMatch?.[1]?.trim() ?? null,
    textExcerpt,
    allowed: res.ok,
    provenance: buildProvenance({
      sourceKind: "approved_crawl",
      sourceUrl: url,
      raw: { status: res.status, bytes: html.length },
      licenseAndReuse: "Public webpage crawl under robots + allowlist",
    }),
    engine: "fetch_compat",
  };
}

async function tryCrawlee(
  urls: string[],
  allowlist: CrawlAllowlistEntry[],
): Promise<CrawlPageResult[] | null> {
  try {
    // Optional dependency — resolved at runtime when crawl is enabled.
    const crawlee = await import(/* webpackIgnore: true */ "crawlee");
    const CheerioCrawler = crawlee.CheerioCrawler;
    if (!CheerioCrawler) return null;

    const maxPages = Math.min(
      urls.length,
      Math.max(...allowlist.map((a) => a.maxPagesPerRun), 1),
    );
    const collected: CrawlPageResult[] = [];
    const crawler = new CheerioCrawler({
      maxRequestsPerCrawl: maxPages,
      async requestHandler({ request, $ }) {
        const entry = findAllowlistEntry(request.url, allowlist);
        if (!entry) {
          collected.push({
            url: request.url,
            status: 0,
            title: null,
            textExcerpt: "",
            allowed: false,
            denialReason: "host_or_path_not_allowlisted",
            provenance: buildProvenance({
              sourceKind: "approved_crawl",
              sourceUrl: request.url,
              raw: { denied: true },
            }),
            engine: "crawlee",
          });
          return;
        }
        const title = $("title").text().trim() || null;
        const textExcerpt = $.root()
          .text()
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 2000);
        collected.push({
          url: request.url,
          status: 200,
          title,
          textExcerpt,
          allowed: true,
          provenance: buildProvenance({
            sourceKind: "approved_crawl",
            sourceUrl: request.url,
            raw: { title, engine: "crawlee" },
            licenseAndReuse:
              "Public webpage crawl via Crawlee under robots + allowlist",
          }),
          engine: "crawlee",
        });
      },
    });
    const approved = urls.filter((u) => findAllowlistEntry(u, allowlist));
    await crawler.run(approved);
    return collected;
  } catch {
    return null;
  }
}

/**
 * Crawlee runner for approved public websites only.
 * Falls back to robots/allowlist-compatible fetch when Crawlee is unavailable.
 */
export async function crawlApprovedUrls(input: {
  urls: string[];
  allowlist?: CrawlAllowlistEntry[];
  signal?: AbortSignal;
}): Promise<CrawlPageResult[]> {
  if (!supportIntelligenceFlags.spiderCrawlEnabled) {
    return input.urls.map((url) => ({
      url,
      status: 0,
      title: null,
      textExcerpt: "",
      allowed: false,
      denialReason: "crawl_flag_disabled",
      provenance: buildProvenance({
        sourceKind: "approved_crawl",
        sourceUrl: url,
        raw: { crawlFlag: false },
      }),
      engine: "fetch_compat",
    }));
  }

  const allowlist = input.allowlist ?? DEFAULT_CRAWL_ALLOWLIST;
  const viaCrawlee = await tryCrawlee(input.urls, allowlist);
  if (viaCrawlee) return viaCrawlee;

  const results: CrawlPageResult[] = [];
  for (const url of input.urls) {
    results.push(await fetchCompatPage(url, input.signal));
  }
  return results;
}
