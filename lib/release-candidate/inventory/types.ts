export type InventoryName =
  | "domain-inventory"
  | "route-inventory"
  | "migration-inventory"
  | "permission-inventory"
  | "placeholder-inventory"
  | "demo-data-inventory"
  | "duplicate-service-inventory"
  | "dead-code-inventory"
  | "environment-inventory"
  | "release-blockers";

export type BlockerSeverity = "blocker" | "warning";

export interface InventoryMetadata {
  name: InventoryName;
  generatedAt: string;
  source: "repository-static-scan";
}

export interface InventoryDocument<TPayload> {
  metadata: InventoryMetadata;
  payload: TPayload;
}

export interface ReleaseBlocker {
  id: string;
  title: string;
  severity: BlockerSeverity;
  evidence: string[];
  requiredAction: string;
}

export interface ReleaseBlockerInventory {
  recommendation: "reject" | "conditional-reject" | "pass";
  blockers: ReleaseBlocker[];
}

export interface CountedPathSample {
  path: string;
  count: number;
}
