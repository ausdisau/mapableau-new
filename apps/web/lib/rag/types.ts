import type { ConsentScope } from "@/lib/prms/types";

/** Product modules that expose retrievable context packs. */
export type ModuleId =
  | "prms"
  | "consent"
  | "care"
  | "transport"
  | "cases"
  | "jobs"
  | "calendar"
  | "billing"
  | "incidents"
  | "access"
  | "orchestration";

export type RagChunk = {
  id: string;
  moduleId: ModuleId;
  /** Stable label for audit (e.g. "upcoming_care_transport"). */
  source: string;
  text: string;
  score: number;
};

export type ModuleRagContext = {
  participantId: string;
  query: string;
  grantedScopes: ConsentScope[];
};

export type ModuleRagProvider = {
  moduleId: ModuleId;
  /** Scopes required to read this module's pack; empty = always allowed. */
  requiredScopes: ConsentScope[];
  retrieve(ctx: ModuleRagContext): Promise<RagChunk[]>;
};

export type InterdependentRagRequest = {
  participantId: string;
  query: string;
  originModule: ModuleId;
  grantedScopes: ConsentScope[];
  /** Max related modules to include (origin + dependencies). Default 6. */
  maxModules?: number;
  /** Max chunks returned across all modules. Default 12. */
  maxChunks?: number;
};

export type InterdependentRagResult = {
  originModule: ModuleId;
  modulesQueried: ModuleId[];
  chunks: RagChunk[];
};
