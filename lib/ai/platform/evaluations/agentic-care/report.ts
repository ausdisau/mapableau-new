import type { AgenticCareGrade } from "./deterministic-graders";
import type { AgenticCareEvalItem, AgenticCareSplit } from "./schema";

export type AgenticCareCaseResult = {
  caseId: string;
  passed: boolean;
  grades: AgenticCareGrade[];
};

export type AgenticCareLocalReport = {
  datasetVersion: string;
  split: AgenticCareSplit | "all";
  totalCases: number;
  passedCases: number;
  failedCases: number;
  productionWrites: false;
  openAiRequests: 0;
  results: AgenticCareCaseResult[];
};

export function formatAgenticCareTextReport(report: AgenticCareLocalReport): string {
  const failures = report.results.filter((result) => !result.passed).map((result) => result.caseId);
  return [
    "MapAble Agentic Care deterministic evaluation",
    `Dataset version: ${report.datasetVersion}`,
    `Split: ${report.split}`,
    `Cases: ${report.totalCases}`,
    `Passed: ${report.passedCases}`,
    `Failed: ${report.failedCases}`,
    `Production writes: ${report.productionWrites}`,
    `OpenAI requests: ${report.openAiRequests}`,
    failures.length ? `Failing cases: ${failures.join(", ")}` : "Failing cases: none",
  ].join("\n");
}

export function datasetVersion(items: AgenticCareEvalItem[]): string {
  const versions = new Set(items.map((item) => item.dataset_version));
  if (versions.size !== 1) throw new Error("Agentic Care dataset contains multiple dataset versions");
  return [...versions][0] ?? "unknown";
}
