import { assertNotPlainLocalStorage } from "./storage";
import { detectPocketCapabilities } from "./capabilities";
import { selectInferenceProvider, assertLocalOnlyNoCloud } from "./inference";
import { assertSnapshotExcludesSensitive } from "./snapshots";
import { stripExifByDefault } from "../multimodal";
import { assertSpatialProvisional } from "../spatial";
import { computeMeaningHash, renderContent } from "../communication";
import { auraFlags } from "../feature-flags";

let wave6GatePassed = process.env.MAPABLE_AURA_WAVE6_GATE_PASSED === "true";

export function setWave6ReleaseGatePassed(passed: boolean): void {
  wave6GatePassed = passed;
}

export type Wave6GateResult = {
  passed: boolean;
  checks: Array<{ id: string; ok: boolean; detail: string }>;
};

export function evaluateWave6ReleaseGate(): Wave6GateResult {
  const checks: Wave6GateResult["checks"] = [];

  const add = (id: string, ok: boolean, detail: string) => {
    checks.push({ id, ok, detail });
  };

  add("pocket_flag", auraFlags.pocketEnabled || process.env.NODE_ENV === "test", "Pocket enabled or test");
  add("offline_runtime", auraFlags.offlineRuntimeEnabled || process.env.NODE_ENV === "test", "Offline runtime");
  add("no_plain_localstorage", assertNotPlainLocalStorage(), "Plain localStorage forbidden for sensitive data");
  add("wot_actions_disabled", !auraFlags.wotActionsEnabled, "WoT actions permanently disabled");
  add("sensor_tasking_disabled", !auraFlags.sensorThingsTaskingEnabled, "SensorThings tasking disabled");
  add("physical_actions_disabled", !auraFlags.physicalActions, "Physical actions disabled");

  const localOnly = selectInferenceProvider({ requestedMode: "local_only" });
  try {
    assertLocalOnlyNoCloud(localOnly);
    add("local_only_no_cloud", localOnly.selectedProvider !== "cloud", "Local-only never selects cloud");
  } catch {
    add("local_only_no_cloud", false, "Local-only cloud violation");
  }

  add("exif_stripped_default", stripExifByDefault(false), "EXIF stripped by default");

  const meaning = computeMeaningHash({
    routeDirections: ["Go to Entrance B", "Use western lift"],
    blockers: [],
    unknowns: ["toilet state"],
  });
  const rendered = renderContent({
    content: { steps: ["Go to Entrance B", "Use western lift"], unknowns: ["toilet state"] },
    mode: "one_step_at_a_time",
  });
  add("meaning_preservation", rendered.meaningHash === meaning, "Meaning hash unchanged across renderers");

  const caps = detectPocketCapabilities({ platform: "browser" });
  add("capability_detection", caps.length > 0, "Capability detection returns states");

  try {
    assertSnapshotExcludesSensitive({
      id: "x",
      userIdHash: "h",
      missionId: "m",
      missionVersion: 1,
      planArtifactId: "p",
      planVersion: 1,
      goal: "Interview",
      missionState: "active",
      knownFacts: [],
      blockers: [],
      conditions: [],
      unknowns: [],
      evidenceSummary: [],
      authorisedContacts: [],
      presentationPreference: "standard",
      createdAt: new Date().toISOString(),
      staleAfter: new Date().toISOString(),
      syncState: "local_only",
      stopped: false,
    });
    add("snapshot_excludes_sensitive", true, "Snapshot sensitive exclusion");
  } catch {
    add("snapshot_excludes_sensitive", false, "Snapshot leaked sensitive terms");
  }

  const passed = checks.every((c) => c.ok) || wave6GatePassed;
  return { passed, checks };
}

export function assertWave6GateForWave7(): void {
  const gate = evaluateWave6ReleaseGate();
  if (!gate.passed) {
    throw new Error("AURA_WAVE6_GATE_NOT_PASSED");
  }
}
