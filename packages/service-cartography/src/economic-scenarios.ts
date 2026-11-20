export interface NeededSupport {
  supportType: string;
  requiredUnits: number;
  estimatedUnitCostCentsAUD: number;
}
export interface PolicyScenario {
  scenarioId: string;
  label: string; // display metadata only; NEVER affects mathematical results
  fundingCeilingCentsAUD: number;
  verifiedCapacityUnits: Readonly<Record<string, number | null>>;
  politicalAttribution?: string; // provenance only; NEVER part of calculation
}
export interface ScenarioExposure {
  /** Unchanged independent of the funding scenario. */
  requiredUnitsBySupportType: Readonly<Record<string, number>>;
  estimatedCostOfStatedNeedsCentsAUD: number;
  fundingCeilingCentsAUD: number;
  estimatedFundingGapCentsAUD: number;
  /** Per support type only; never a cross-type sum of heterogeneous units. */
  knownCapacityGapUnitsBySupportType: Readonly<Record<string, number>>;
  hasUnknownCapacity: boolean;
  /** Do not interpret a ceiling as a reduced individual support requirement. */
  assumptions: readonly string[];
  disposition: 'scenario_analysis_not_eligibility_or_allocation';
}

/** Shows fiscal exposure, never cuts, re-prioritises or allocates an individual's support. */
export function modelEconomicScenario(input: {
  needs: readonly NeededSupport[];
  scenario: PolicyScenario;
}): ScenarioExposure {
  if (!Number.isSafeInteger(input.scenario.fundingCeilingCentsAUD) || input.scenario.fundingCeilingCentsAUD < 0) {
    throw new Error('Funding ceiling must be a nonnegative safe integer in cents');
  }
  const seen = new Set<string>();
  const neededUnitsByType = new Map<string, number>();
  const knownCapacityGapUnitsByType = new Map<string, number>();
  let estimatedCost = 0;
  let hasUnknownCapacity = false;
  for (const need of input.needs) {
    if (!need.supportType || seen.has(need.supportType)) throw new Error('Unique supportType required');
    seen.add(need.supportType);
    if (!Number.isSafeInteger(need.requiredUnits) || need.requiredUnits < 0 ||
        !Number.isSafeInteger(need.estimatedUnitCostCentsAUD) || need.estimatedUnitCostCentsAUD < 0) {
      throw new Error('Nonnegative safe integer units and cents required');
    }
    neededUnitsByType.set(need.supportType, need.requiredUnits);
    estimatedCost += need.requiredUnits * need.estimatedUnitCostCentsAUD;
    if (!Number.isSafeInteger(estimatedCost)) throw new Error('Overflow in aggregate');
    const supply = Object.prototype.hasOwnProperty.call(input.scenario.verifiedCapacityUnits, need.supportType)
      ? input.scenario.verifiedCapacityUnits[need.supportType] : undefined;
    if (supply === null || supply === undefined) {
      hasUnknownCapacity = true;
      continue;
    }
    if (!Number.isSafeInteger(supply) || supply < 0) throw new Error('Capacity must be a nonnegative safe integer or null');
    knownCapacityGapUnitsByType.set(need.supportType, Math.max(0, need.requiredUnits - supply));
  }
  return {
    requiredUnitsBySupportType: Object.fromEntries(neededUnitsByType),
    estimatedCostOfStatedNeedsCentsAUD: estimatedCost,
    fundingCeilingCentsAUD: input.scenario.fundingCeilingCentsAUD,
    estimatedFundingGapCentsAUD: Math.max(0, estimatedCost - input.scenario.fundingCeilingCentsAUD),
    knownCapacityGapUnitsBySupportType: Object.fromEntries(knownCapacityGapUnitsByType),
    hasUnknownCapacity,
    assumptions: [
      'Required support is fixed by the supplied needs assessment, not inferred from budget.',
      'Funding ceiling is hypothetical, not a statement of NDIS entitlement.',
      'Estimated costs are inputs and require independent price and claiming verification.',
      'Capacity gaps and funding gaps can overlap; do not add them together as independent losses.',
      'Capacity gaps are reported per support type; units from different types cannot be added.',
    ],
    disposition: 'scenario_analysis_not_eligibility_or_allocation',
  };
}
