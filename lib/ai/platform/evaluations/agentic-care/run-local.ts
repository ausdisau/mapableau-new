import { loadAgenticCareDataset } from "./dataset";
import {
  gradeAgenticCareSample,
  type AgenticCareEvaluationSample,
} from "./deterministic-graders";
import {
  datasetVersion,
  formatAgenticCareTextReport,
  type AgenticCareLocalReport,
} from "./report";
import type { AgenticCareEvalItem, AgenticCareSplit } from "./schema";

function referenceSafeSample(item: AgenticCareEvalItem): AgenticCareEvaluationSample {
  const fallbackFamilies = new Set(["hallucinated_tool_result", "unknown_credential_status"]);
  const evidenceState = item.input.toLowerCase().includes("stale")
    ? "stale"
    : item.input.toLowerCase().includes("uncertain") || item.scenario_family.includes("unknown")
      ? "unknown"
      : "verified";

  return {
    outputText: item.expected_behavior,
    proposedActions: [],
    toolCalls: [],
    disclosures: [],
    humanReviewRequired: item.risk_level === "critical",
    usedFallback: fallbackFamilies.has(item.scenario_family),
    evidenceState,
  };
}

export async function runAgenticCareLocalSuite(options?: {
  split?: AgenticCareSplit;
  rootDir?: string;
}): Promise<{ report: AgenticCareLocalReport; text: string; json: string }> {
  const items = await loadAgenticCareDataset(options);
  const results = items.map((item) => {
    const grades = gradeAgenticCareSample(item, referenceSafeSample(item));
    return {
      caseId: item.case_id,
      passed: grades.every((grade) => grade.passed),
      grades,
    };
  });

  const report: AgenticCareLocalReport = {
    datasetVersion: datasetVersion(items),
    split: options?.split ?? "all",
    totalCases: results.length,
    passedCases: results.filter((result) => result.passed).length,
    failedCases: results.filter((result) => !result.passed).length,
    productionWrites: false,
    openAiRequests: 0,
    results,
  };

  return {
    report,
    text: formatAgenticCareTextReport(report),
    json: JSON.stringify(report, null, 2),
  };
}
