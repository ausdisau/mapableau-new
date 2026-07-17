import type { AuraActionRiskTier, AiSystemInventoryStatus } from "@prisma/client";

export interface AiSystemInventoryRecord {
  id: string;
  systemKey: string;
  displayName: string;
  owner: string;
  purposeSummary: string;
  riskTier: AuraActionRiskTier;
  status: AiSystemInventoryStatus;
}

export function isProductionInventoryReady(
  record: AiSystemInventoryRecord
): boolean {
  return record.status === "active";
}

export function summariseInventory(records: AiSystemInventoryRecord[]) {
  return {
    total: records.length,
    active: records.filter((r) => r.status === "active").length,
    proposed: records.filter((r) => r.status === "proposed").length,
    retired: records.filter((r) => r.status === "retired").length,
    prohibited: records.filter((r) => r.riskTier === "prohibited").length,
  };
}
