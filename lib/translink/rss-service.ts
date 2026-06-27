import type { PtDisruption } from "@/lib/public-transport/types";

function extractRssItems(xml: string): PtDisruption[] {
  const items: PtDisruption[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1] ?? "";
    const title = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim();
    const link = block.match(/<link>([\s\S]*?)<\/link>/i)?.[1]?.trim();
    const description = block
      .match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]
      ?.trim();
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim();

    if (title) {
      items.push({
        headline: title.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
        description,
        url: link,
        publishedAt: pubDate,
        status: "current",
      });
    }
  }

  return items;
}

export async function fetchRssDisruptions(url: string): Promise<PtDisruption[]> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { Accept: "application/rss+xml, application/xml, text/xml" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return extractRssItems(xml);
  } catch {
    return [];
  }
}

export async function fetchAllTranslinkRssDisruptions(urls: string[]): Promise<PtDisruption[]> {
  const results = await Promise.all(urls.map(fetchRssDisruptions));
  const seen = new Set<string>();
  const merged: PtDisruption[] = [];

  for (const batch of results) {
    for (const item of batch) {
      const key = item.headline;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }

  return merged.slice(0, 50);
}
