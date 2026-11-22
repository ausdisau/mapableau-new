import { z } from "zod";

/**
 * MapAble Search's public-only, fixed GraphQL discovery operation.
 * This is an allowlisted persisted operation, NOT an arbitrary GraphQL engine.
 * Keep private participant, worker, employment applications and consent data
 * outside this boundary. No model outputs, ad bids or sponsor data are inputs.
 */
export const MAPABLE_DIRECTORY_QUERY = `query MapAbleDirectory($text: String!, $state: String, $limit: Int!) {
  mapAbleDirectory(text: $text, state: $state, limit: $limit) {
    providers {
      id
      name
      state
      locality
      source
      evidenceStatus
      registrationStatus
      availability
    }
    graph {
      nodes { id label kind }
      edges { sourceId targetId kind }
    }
    sources { neon supabase }
  }
}`;

export const directoryVariables = z.object({
  text: z.string().trim().min(2).max(80),
  state: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"]).nullable().optional(),
  limit: z.number().int().min(1).max(20).default(10),
}).strict();

export const persistedDirectoryOperation = z.object({
  operationName: z.literal("MapAbleDirectory"),
  query: z.literal(MAPABLE_DIRECTORY_QUERY),
  variables: directoryVariables,
}).strict();

export type DirectoryVariables = z.infer<typeof directoryVariables>;
export type SourceName = "neon" | "supabase";
export type SourceState = "ok" | "disabled" | "unavailable";

export type PublicDirectoryProvider = Readonly<{
  id: string;
  name: string;
  state: string | null;
  locality: string | null;
  source: SourceName;
  evidenceStatus: "imported_or_self_described";
  registrationStatus: "not_currently_verified";
  availability: "unknown";
}>;

export type DirectoryGraph = Readonly<{
  nodes: ReadonlyArray<{ id: string; label: string; kind: "provider" | "state" | "source" }>;
  edges: ReadonlyArray<{ sourceId: string; targetId: string; kind: "source_record" | "listed_in_state" }>;
}>;

export type PublicDirectoryResult = Readonly<{
  providers: PublicDirectoryProvider[];
  graph: DirectoryGraph;
  sources: { neon: SourceState; supabase: SourceState };
}>;

export interface PublicDirectorySource {
  readonly name: SourceName;
  search(variables: DirectoryVariables): Promise<PublicDirectoryProvider[]>;
}

export type SourceStatus = { enabled: boolean; adapter: PublicDirectorySource };

function sanitizeProvider(row: PublicDirectoryProvider, source: SourceName): PublicDirectoryProvider | null {
  if (
    row.source !== source ||
    typeof row.id !== "string" ||
    !/^[A-Za-z0-9_.:-]{1,128}$/.test(row.id) ||
    typeof row.name !== "string" ||
    !row.name.trim() ||
    row.evidenceStatus !== "imported_or_self_described" ||
    row.registrationStatus !== "not_currently_verified" ||
    row.availability !== "unknown"
  ) return null;

  const state = typeof row.state === "string" &&
    /^(NSW|VIC|QLD|SA|WA|TAS|ACT|NT)$/.test(row.state)
    ? row.state : null;
  const locality = typeof row.locality === "string" ?
    row.locality.trim().replace(/[\\u0000-\\u001f\\u007f]/g, "").slice(0, 80) : null;
  // Explicit allowlist: never reflect contact data, worker IDs, bids,
  // diagnostics, participant data, extra fields or unknown status claims.
  return {
    id: row.id,
    name: row.name.trim().replace(/[\\u0000-\\u001f\\u007f]/g, "").slice(0, 160),
    state,
    locality,
    source,
    evidenceStatus: "imported_or_self_described",
    registrationStatus: "not_currently_verified",
    availability: "unknown",
  };
}

function safeSort(a: PublicDirectoryProvider, b: PublicDirectoryProvider): number {
  return a.name.localeCompare(b.name) ||
    a.source.localeCompare(b.source) ||
    a.id.localeCompare(b.id);
}

/** GraphGL-compatible node/edge arrays with no patient or worker identities. */
export function toDirectoryGraph(rows: readonly PublicDirectoryProvider[]): DirectoryGraph {
  const nodes = new Map<string, DirectoryGraph["nodes"][number]>();
  const edges: DirectoryGraph["edges"][number][] = [];
  for (const row of rows) {
    const providerId = `provider:${row.source}:${row.id}`;
    const sourceId = `source:${row.source}`;
    nodes.set(providerId, { id: providerId, label: row.name, kind: "provider" });
    nodes.set(sourceId, {
      id: sourceId,
      label: row.source === "neon" ? "MapAble Neon" : "MapAble Supabase",
      kind: "source",
    });
    edges.push({ sourceId, targetId: providerId, kind: "source_record" });
    if (row.state) {
      const stateId = `state:${row.state}`;
      nodes.set(stateId, { id: stateId, label: row.state, kind: "state" });
      edges.push({ sourceId: providerId, targetId: stateId, kind: "listed_in_state" });
    }
  }
  return { nodes: [...nodes.values()], edges };
}

/**
 * A failing/paused source never causes fabricated results from the other.
 * No cross-database JOIN, inference of worker clearances, ad ranking or
 * confirmation of provider registration is performed.
 */
export async function queryPublicDirectory(
  rawVariables: unknown,
  sources: readonly SourceStatus[],
): Promise<PublicDirectoryResult> {
  const variables = directoryVariables.parse(rawVariables);
  const states: PublicDirectoryResult["sources"] = {
    neon: "disabled",
    supabase: "disabled",
  };
  const selected = sources.filter((source) => source.enabled);
  const results = await Promise.allSettled(
    selected.map((entry) => entry.adapter.search(variables)),
  );
  const providers: PublicDirectoryProvider[] = [];
  results.forEach((result, index) => {
    const name = selected[index]!.adapter.name;
    if (result.status === "fulfilled") {
      states[name] = "ok";
      for (const row of result.value.slice(0, variables.limit)) {
        const allowed = sanitizeProvider(row, name);
        if (allowed) providers.push(allowed);
      }
    } else {
      states[name] = "unavailable";
    }
  });
  providers.sort(safeSort);
  const bounded = providers.slice(0, variables.limit);
  return { providers: bounded, graph: toDirectoryGraph(bounded), sources: states };
}

/** Fail closed. Deployment and distributed abuse controls are separate gates. */
export function federatedDirectoryFlags(
  env: Record<string, string | undefined> = process.env,
) {
  return {
    endpoint: env.MAPABLE_FEDERATED_DIRECTORY_ENABLED === "true",
    neon: env.MAPABLE_FEDERATED_DIRECTORY_NEON_ENABLED === "true",
    supabase: env.MAPABLE_FEDERATED_DIRECTORY_SUPABASE_ENABLED === "true",
  };
}
