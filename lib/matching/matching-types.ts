export type MatchCandidateScore = {
  entityId: string;
  entityType: "worker" | "provider" | "driver";
  totalScore: number;
  hardFilterPassed: boolean;
  reasons: MatchReason[];
  warnings: string[];
};

export type MatchReason = {
  code: string;
  label: string;
  weight: number;
};
