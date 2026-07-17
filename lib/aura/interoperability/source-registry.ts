import { randomUUID } from "crypto";

import { auraFlags } from "../feature-flags";

export type AuraInteroperabilitySource = {
  id: string;
  type:
    | "gtfs_schedule"
    | "gtfs_realtime"
    | "indoorgml"
    | "curb"
    | "sensorthings"
    | "wot_thing_description"
    | "manual"
    | "partner_api";
  organisationId?: string;
  name: string;
  sourceUrl?: string;
  standardName?: string;
  standardVersion?: string;
  licence?: string;
  attribution?: string;
  trustState: "approved" | "pilot" | "quarantined" | "disabled";
  freshnessPolicyId: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ImportStage =
  | "registered"
  | "downloading"
  | "downloaded"
  | "parsing"
  | "validating"
  | "quarantined"
  | "ready_for_dry_run"
  | "dry_run_complete"
  | "approved"
  | "importing"
  | "imported"
  | "superseded"
  | "failed";

export type AuraImportRun = {
  id: string;
  sourceId: string;
  stage: ImportStage;
  rawSourceHash: string;
  parserVersion: string;
  validationWarnings: string[];
  unsupportedFields: string[];
  importCounts: Record<string, number>;
  retrievedAt: string;
  createdAt: string;
};

const sources = new Map<string, AuraInteroperabilitySource>();
const imports = new Map<string, AuraImportRun>();

export function resetInteropStore(): void {
  sources.clear();
  imports.clear();
}

export function registerSource(
  input: Omit<AuraInteroperabilitySource, "id" | "createdAt" | "updatedAt">,
): AuraInteroperabilitySource {
  const now = new Date().toISOString();
  const source: AuraInteroperabilitySource = {
    ...input,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  sources.set(source.id, source);
  return source;
}

export function listSources(): AuraInteroperabilitySource[] {
  return [...sources.values()];
}

export function getSource(id: string): AuraInteroperabilitySource | null {
  return sources.get(id) ?? null;
}

export function startImport(input: {
  sourceId: string;
  rawSourceHash: string;
  parserVersion: string;
}): AuraImportRun {
  const source = sources.get(input.sourceId);
  if (!source) throw new Error("AURA_SOURCE_NOT_FOUND");
  if (source.trustState === "quarantined" || source.trustState === "disabled") {
    throw new Error("AURA_SOURCE_QUARANTINED");
  }

  const run: AuraImportRun = {
    id: randomUUID(),
    sourceId: input.sourceId,
    stage: "registered",
    rawSourceHash: input.rawSourceHash,
    parserVersion: input.parserVersion,
    validationWarnings: [],
    unsupportedFields: [],
    importCounts: {},
    retrievedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  imports.set(run.id, run);
  return run;
}

export function advanceImport(
  importId: string,
  stage: ImportStage,
  patch?: Partial<AuraImportRun>,
): AuraImportRun {
  const run = imports.get(importId);
  if (!run) throw new Error("AURA_IMPORT_NOT_FOUND");
  const updated = { ...run, ...patch, stage };
  imports.set(importId, updated);
  return updated;
}

export function getImport(importId: string): AuraImportRun | null {
  return imports.get(importId) ?? null;
}
