import { createHash, randomUUID } from "crypto";

import type {
  AccessibilityAssetInput,
  AccessibilityAssetVersionInput,
  AccessibilityOutcome,
  AccessibilityRuleAutomation,
  AccessibilityRuleInput,
  AccessibilityRuleProfile,
  AccessibilityRuleVersionInput,
  AccessibilitySeverity,
  AccessibilityAssetClass,
  AccessibilityAssetCriticality,
  AccessibilityAssetLifecycle,
  AccessibilityAssetType,
  AccessibilityVisibility,
} from "./types";

export interface StoredAsset {
  id: string;
  stableKey: string;
  organisationId: string | null;
  ownerUserId: string | null;
  assetClass: AccessibilityAssetClass;
  assetType: AccessibilityAssetType;
  title: string;
  plainLanguageTitle: string | null;
  description: string | null;
  criticality: AccessibilityAssetCriticality;
  lifecycleState: AccessibilityAssetLifecycle;
  visibility: AccessibilityVisibility;
  sourceSystem: string | null;
  deploymentEnvironment: string | null;
  canonicalDomainRef: string | null;
  purposeTags: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  retiredAt: Date | null;
  versions: StoredAssetVersion[];
  dependencies: StoredDependency[];
  owners: StoredOwner[];
}

export interface StoredAssetVersion {
  id: string;
  assetId: string;
  versionLabel: string;
  contentHash: string | null;
  changelog: string | null;
  sourceRevision: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface StoredDependency {
  id: string;
  assetId: string;
  dependsOnAssetId: string;
  dependencyType: string;
  createdAt: Date;
}

export interface StoredOwner {
  id: string;
  assetId: string;
  userId: string;
  roleLabel: string;
  accountable: boolean;
  createdAt: Date;
}

export interface StoredStandardSource {
  id: string;
  organisation: string;
  title: string;
  version: string;
  status: string;
  publicationDate: string | null;
  retrievalDate: string;
  effectiveDate: string | null;
  createdAt: Date;
}

export interface StoredRule {
  id: string;
  stableKey: string;
  title: string;
  plainLanguageTitle: string;
  description: string;
  profile: AccessibilityRuleProfile;
  automation: AccessibilityRuleAutomation;
  standardSourceId: string;
  requirementRefs: string[];
  internalInterpretation: string | null;
  severityDefault: AccessibilitySeverity;
  ownerUserId: string | null;
  knownLimitations: string | null;
  evidenceRequirements: string | null;
  createdAt: Date;
  updatedAt: Date;
  versions: StoredRuleVersion[];
  applicability: StoredApplicability[];
}

export interface StoredRuleVersion {
  id: string;
  ruleId: string;
  versionLabel: string;
  expectation: string;
  assumptions: string | null;
  inputRequirements: string | null;
  effectiveFrom: Date;
  reviewBy: Date | null;
  supersededByRuleVersionId: string | null;
  createdAt: Date;
}

export interface StoredApplicability {
  id: string;
  ruleId: string;
  assetClass: AccessibilityAssetClass | null;
  assetType: AccessibilityAssetType | null;
  notes: string | null;
}

export interface StoredShadowEvaluation {
  id: string;
  assetId: string;
  assetVersionId: string | null;
  mode: string;
  correlationId: string;
  commercialPlanIgnored: boolean;
  resultsJson: Array<{
    ruleId: string;
    ruleStableKey: string;
    ruleVersionId: string;
    outcome: AccessibilityOutcome;
    reasonCodes: string[];
    severityDefault: AccessibilitySeverity;
    notes?: string;
    evidenceRefs: string[];
  }>;
  createdAt: Date;
}

export interface AccessibilityOpsMemoryStore {
  assets: Map<string, StoredAsset>;
  assetsByKey: Map<string, string>;
  rules: Map<string, StoredRule>;
  rulesByKey: Map<string, string>;
  standards: Map<string, StoredStandardSource>;
  evaluations: Map<string, StoredShadowEvaluation>;
}

declare global {
  // eslint-disable-next-line no-var
  var __mapableAccessibilityOpsStore: AccessibilityOpsMemoryStore | undefined;
}

export function getMemoryStore(): AccessibilityOpsMemoryStore {
  if (!globalThis.__mapableAccessibilityOpsStore) {
    globalThis.__mapableAccessibilityOpsStore = {
      assets: new Map(),
      assetsByKey: new Map(),
      rules: new Map(),
      rulesByKey: new Map(),
      standards: new Map(),
      evaluations: new Map(),
    };
  }
  return globalThis.__mapableAccessibilityOpsStore;
}

export function resetMemoryStore(): void {
  globalThis.__mapableAccessibilityOpsStore = {
    assets: new Map(),
    assetsByKey: new Map(),
    rules: new Map(),
    rulesByKey: new Map(),
    standards: new Map(),
    evaluations: new Map(),
  };
}

export function memoryCreateAsset(
  input: AccessibilityAssetInput & { criticality: AccessibilityAssetCriticality }
): StoredAsset {
  const store = getMemoryStore();
  const orgKey = input.organisationId ?? "__platform__";
  const compositeKey = `${orgKey}:${input.stableKey}`;
  if (store.assetsByKey.has(compositeKey)) {
    throw new Error("ASSET_STABLE_KEY_CONFLICT");
  }
  const now = new Date();
  const asset: StoredAsset = {
    id: randomUUID(),
    stableKey: input.stableKey,
    organisationId: input.organisationId ?? null,
    ownerUserId: input.ownerUserId ?? null,
    assetClass: input.assetClass,
    assetType: input.assetType,
    title: input.title,
    plainLanguageTitle: input.plainLanguageTitle ?? null,
    description: input.description ?? null,
    criticality: input.criticality,
    lifecycleState: input.lifecycleState ?? "registered",
    visibility: input.visibility ?? "internal",
    sourceSystem: input.sourceSystem ?? null,
    deploymentEnvironment: input.deploymentEnvironment ?? null,
    canonicalDomainRef: input.canonicalDomainRef ?? null,
    purposeTags: input.purposeTags ?? [],
    metadata: input.metadata ?? {},
    createdAt: now,
    updatedAt: now,
    retiredAt: null,
    versions: [],
    dependencies: [],
    owners: [],
  };
  store.assets.set(asset.id, asset);
  store.assetsByKey.set(compositeKey, asset.id);
  if (input.ownerUserId) {
    asset.owners.push({
      id: randomUUID(),
      assetId: asset.id,
      userId: input.ownerUserId,
      roleLabel: "primary_owner",
      accountable: true,
      createdAt: now,
    });
  }
  return asset;
}

export function memoryAddAssetVersion(
  assetId: string,
  input: AccessibilityAssetVersionInput
): StoredAssetVersion {
  const asset = getMemoryStore().assets.get(assetId);
  if (!asset) throw new Error("ASSET_NOT_FOUND");
  const version: StoredAssetVersion = {
    id: randomUUID(),
    assetId,
    versionLabel: input.versionLabel,
    contentHash:
      input.contentHash ??
      createHash("sha256")
        .update(`${assetId}:${input.versionLabel}:${input.sourceRevision ?? ""}`)
        .digest("hex"),
    changelog: input.changelog ?? null,
    sourceRevision: input.sourceRevision ?? null,
    metadata: input.metadata ?? {},
    createdAt: new Date(),
  };
  asset.versions.push(version);
  asset.updatedAt = new Date();
  return version;
}

export function memoryAddDependency(
  assetId: string,
  dependsOnAssetId: string,
  dependencyType: string
): StoredDependency {
  const store = getMemoryStore();
  const asset = store.assets.get(assetId);
  if (!asset) throw new Error("ASSET_NOT_FOUND");
  if (!store.assets.has(dependsOnAssetId)) throw new Error("DEPENDENCY_NOT_FOUND");
  const dep: StoredDependency = {
    id: randomUUID(),
    assetId,
    dependsOnAssetId,
    dependencyType,
    createdAt: new Date(),
  };
  asset.dependencies.push(dep);
  return dep;
}

export function memoryUpsertStandard(input: {
  organisation: string;
  title: string;
  version: string;
  status: string;
  publicationDate?: string | null;
  retrievalDate: string;
  effectiveDate?: string | null;
}): StoredStandardSource {
  const store = getMemoryStore();
  const existing = [...store.standards.values()].find(
    (s) =>
      s.organisation === input.organisation &&
      s.title === input.title &&
      s.version === input.version
  );
  if (existing) return existing;
  const row: StoredStandardSource = {
    id: randomUUID(),
    organisation: input.organisation,
    title: input.title,
    version: input.version,
    status: input.status,
    publicationDate: input.publicationDate ?? null,
    retrievalDate: input.retrievalDate,
    effectiveDate: input.effectiveDate ?? null,
    createdAt: new Date(),
  };
  store.standards.set(row.id, row);
  return row;
}

export function memoryCreateRule(
  input: AccessibilityRuleInput,
  standardSourceId: string,
  version: AccessibilityRuleVersionInput
): StoredRule {
  const store = getMemoryStore();
  if (store.rulesByKey.has(input.stableKey)) {
    throw new Error("RULE_STABLE_KEY_CONFLICT");
  }
  const now = new Date();
  const rule: StoredRule = {
    id: randomUUID(),
    stableKey: input.stableKey,
    title: input.title,
    plainLanguageTitle: input.plainLanguageTitle,
    description: input.description,
    profile: input.profile,
    automation: input.automation,
    standardSourceId,
    requirementRefs: input.requirementRefs ?? [],
    internalInterpretation: input.internalInterpretation ?? null,
    severityDefault: input.severityDefault ?? "moderate",
    ownerUserId: input.ownerUserId ?? null,
    knownLimitations: input.knownLimitations ?? null,
    evidenceRequirements: input.evidenceRequirements ?? null,
    createdAt: now,
    updatedAt: now,
    versions: [],
    applicability: [],
  };
  const rv: StoredRuleVersion = {
    id: randomUUID(),
    ruleId: rule.id,
    versionLabel: version.versionLabel,
    expectation: version.expectation,
    assumptions: version.assumptions ?? null,
    inputRequirements: version.inputRequirements ?? null,
    effectiveFrom: version.effectiveFrom ?? now,
    reviewBy: version.reviewBy ?? null,
    supersededByRuleVersionId: version.supersededByRuleVersionId ?? null,
    createdAt: now,
  };
  rule.versions.push(rv);
  store.rules.set(rule.id, rule);
  store.rulesByKey.set(rule.stableKey, rule.id);
  return rule;
}

export function memoryAddApplicability(
  ruleId: string,
  assetClass: AccessibilityAssetClass | null,
  assetType: AccessibilityAssetType | null,
  notes?: string
): StoredApplicability {
  const rule = getMemoryStore().rules.get(ruleId);
  if (!rule) throw new Error("RULE_NOT_FOUND");
  const row: StoredApplicability = {
    id: randomUUID(),
    ruleId,
    assetClass,
    assetType,
    notes: notes ?? null,
  };
  rule.applicability.push(row);
  return row;
}

export function memorySaveEvaluation(
  evaluation: StoredShadowEvaluation
): StoredShadowEvaluation {
  getMemoryStore().evaluations.set(evaluation.id, evaluation);
  return evaluation;
}

export function memoryListAssets(organisationId?: string | null): StoredAsset[] {
  const all = [...getMemoryStore().assets.values()];
  if (!organisationId) return all;
  return all.filter(
    (a) => a.organisationId === organisationId || a.organisationId === null
  );
}

export function memoryGetAsset(assetId: string): StoredAsset | null {
  return getMemoryStore().assets.get(assetId) ?? null;
}

export function memoryListRules(): StoredRule[] {
  return [...getMemoryStore().rules.values()];
}

export function memoryGetRule(ruleId: string): StoredRule | null {
  return getMemoryStore().rules.get(ruleId) ?? null;
}

export function memoryCurrentRuleVersion(
  rule: StoredRule
): StoredRuleVersion | null {
  const active = rule.versions
    .filter((v) => !v.supersededByRuleVersionId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return active[0] ?? rule.versions[rule.versions.length - 1] ?? null;
}
