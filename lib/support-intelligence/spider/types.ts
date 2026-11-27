import { z } from "zod";

import type { Paginated, PaginationInput, Provenance } from "@/lib/support-intelligence/types";

export const SpiderProviderRecordSchema = z.object({
  sourceId: z.string().min(1),
  providerName: z.string().min(1),
  abn: z.string().nullable(),
  registrationNumber: z.string().nullable(),
  website: z.string().nullable(),
  state: z.string().nullable(),
  postcode: z.string().nullable(),
  suburb: z.string().nullable(),
  services: z.array(z.string()),
  registrationGroups: z.array(z.string()),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  isDemo: z.boolean().default(false),
  raw: z.record(z.string(), z.unknown()),
});
export type SpiderProviderRecord = z.infer<typeof SpiderProviderRecordSchema>;

export type SpiderPage = Paginated<SpiderProviderRecord> & {
  provenance: Provenance;
};

export type SourceAdapterContext = {
  pagination: PaginationInput;
  signal?: AbortSignal;
};

export type SourceAdapter = {
  id: string;
  label: string;
  /** Prefer API sources over crawl. */
  kind: "api" | "crawl" | "fixture";
  fetchPage: (ctx: SourceAdapterContext) => Promise<SpiderPage>;
};

export const CrawlAllowlistEntrySchema = z.object({
  host: z.string().min(1),
  paths: z.array(z.string()).default(["/"]),
  maxPagesPerRun: z.number().int().positive().default(25),
  robotsRequired: z.boolean().default(true),
});
export type CrawlAllowlistEntry = z.infer<typeof CrawlAllowlistEntrySchema>;
