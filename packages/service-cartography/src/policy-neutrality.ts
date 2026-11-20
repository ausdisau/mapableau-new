import type { NeededSupport, PolicyScenario } from './economic-scenarios';
import { modelEconomicScenario } from './economic-scenarios';

export interface PolicyLabelInvarianceResult {
  passed: boolean;
  differences: string[];
  method: 'counterfactual_relabeling';
}

/** Changing a political attribution or scenario display name cannot change economic maths. */
export function checkPolicyLabelInvariance(input: {
  needs: readonly NeededSupport[];
  scenario: PolicyScenario;
  alternativeLabel: string;
  alternativePoliticalAttribution: string;
}): PolicyLabelInvarianceResult {
  const baseline = modelEconomicScenario({ needs: input.needs, scenario: input.scenario });
  const alternative = modelEconomicScenario({ needs: input.needs,
    scenario: { ...input.scenario, label: input.alternativeLabel,
      politicalAttribution: input.alternativePoliticalAttribution } });
  const differences: string[] = [];
  for (const key of Object.keys(baseline) as Array<keyof typeof baseline>) {
    if (JSON.stringify(baseline[key]) !== JSON.stringify(alternative[key])) differences.push(key);
  }
  return { passed: !differences.length, differences, method: 'counterfactual_relabeling' };
}
