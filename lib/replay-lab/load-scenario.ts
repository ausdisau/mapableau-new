import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  validateScenarioDocument,
  validateScenarioYaml,
  type ValidatedReplayScenario,
} from "./scenario-schema";

export function loadScenarioYamlFile(absoluteOrRepoRelativePath: string): ValidatedReplayScenario {
  const path = absoluteOrRepoRelativePath.startsWith("/")
    ? absoluteOrRepoRelativePath
    : join(process.cwd(), absoluteOrRepoRelativePath);
  const source = readFileSync(path, "utf8");
  return validateScenarioYaml(source);
}

export function loadHarbourStartingWorkScenario(): ValidatedReplayScenario {
  return loadScenarioYamlFile("data/replay-lab/harbour-starting-work.v1.yaml");
}

export function assertTaylorHarbourRefs(doc: ValidatedReplayScenario): void {
  if (doc.participant.fixture !== "fixture:taylor") {
    throw new Error(`Expected fixture:taylor, got ${doc.participant.fixture}`);
  }
  if (doc.world?.harbourSnapshotId && doc.world.harbourSnapshotId !== "harbour-civic-synthetic-v1") {
    throw new Error(`Unexpected harbour snapshot: ${doc.world.harbourSnapshotId}`);
  }
  validateScenarioDocument(doc);
}
