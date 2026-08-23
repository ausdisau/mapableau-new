import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

import {
  AUTONOMY_MODES,
  LABS_SIMULATION_DATA,
} from "@/lib/labs/contracts";
import {
  mobilityFuturesExperiment,
  mobilityFuturesScenario,
} from "@/lib/labs/experiments/mobility-futures";
import {
  createScenarioEngine,
  createInitialScenarioState,
  reduceScenario,
} from "@/lib/labs/runtime";
import {
  isForbiddenGaisWriteImport,
  FORBIDDEN_GAIS_WRITE_IMPORTS,
} from "@/lib/labs/runtime/boundary";
import {
  LABS_FORBIDDEN_ACTUATION_COMMANDS,
  labsContractsContainActuation,
} from "@/lib/labs/runtime/actuation-guard";

const AT = "2026-08-23T04:00:00.000Z";

function runToFirstDecision(mode: (typeof AUTONOMY_MODES)[number]) {
  let state = createInitialScenarioState(mobilityFuturesScenario, mode);
  state = reduceScenario(
    state,
    { type: "START", autonomyMode: mode, runId: "run-1", at: AT },
    mobilityFuturesScenario,
  );
  // INFORM/SUGGEST may stop at home; continue until decision or complete
  let guard = 0;
  while (
    state.phase === "RUNNING" &&
    !state.pendingDecision &&
    state.phase !== "COMPLETED" &&
    guard < 20
  ) {
    state = reduceScenario(
      state,
      { type: "CONTINUE", at: AT },
      mobilityFuturesScenario,
    );
    guard += 1;
  }
  return state;
}

describe("Mobility Futures scenario determinism", () => {
  it("starts in SIMULATION demonstration experiment", () => {
    expect(mobilityFuturesExperiment.environmentMode).toBe("SIMULATION");
    expect(mobilityFuturesExperiment.status).toBe("DEMONSTRATION");
    expect(mobilityFuturesExperiment.labsSimulationData).toBe(LABS_SIMULATION_DATA);
  });

  it("journey includes HOME→PATH→CROSSING→STATION→LIFT→CAFE", () => {
    expect(mobilityFuturesScenario.path).toEqual([
      "home",
      "path",
      "crossing",
      "station",
      "lift",
      "cafe",
    ]);
  });

  it("exposes at least three decision events", () => {
    const events = Object.values(mobilityFuturesScenario.eventsByNodeId).flat();
    expect(events.filter((e) => e.requiresDecision).length).toBeGreaterThanOrEqual(3);
    expect(events.map((e) => e.type)).toEqual(
      expect.arrayContaining([
        "TEMPORARY_OBSTRUCTION",
        "UNKNOWN_ROUTE_SEGMENT",
        "LIFT_OUTAGE",
      ]),
    );
  });

  it("same commands produce identical states", () => {
    const a = runToFirstDecision("INFORM");
    const b = runToFirstDecision("INFORM");
    expect(a.phase).toBe(b.phase);
    expect(a.pendingEvent?.type).toBe(b.pendingEvent?.type);
    expect(a.currentNodeId).toBe(b.currentNodeId);
  });
});

describe("Autonomy modes", () => {
  it.each(AUTONOMY_MODES)("mode %s reaches a decision point", (mode) => {
    const state = runToFirstDecision(mode);
    expect(state.phase).toBe("DECISION_REQUIRED");
    expect(state.pendingDecision).not.toBeNull();
  });

  it("SUGGEST marks a recommended option", () => {
    const state = runToFirstDecision("SUGGEST");
    expect(state.pendingDecision?.options.some((o) => o.recommended)).toBe(true);
  });

  it("INFORM does not mark recommendations", () => {
    const state = runToFirstDecision("INFORM");
    expect(state.pendingDecision?.options.every((o) => !o.recommended)).toBe(true);
  });
});

describe("Participant pause and override", () => {
  it("pauses and resumes", () => {
    let state = runToFirstDecision("INFORM");
    state = reduceScenario(
      state,
      { type: "PAUSE", at: AT },
      mobilityFuturesScenario,
    );
    expect(state.phase).toBe("PAUSED");
    state = reduceScenario(
      state,
      { type: "CONTINUE", at: AT },
      mobilityFuturesScenario,
    );
    expect(state.phase).toBe("DECISION_REQUIRED");
  });

  it("participant choice advances and records agency", () => {
    let state = runToFirstDecision("INFORM");
    const optionId = state.pendingDecision!.options[0]!.id;
    state = reduceScenario(
      state,
      { type: "PARTICIPANT_CHOICE", optionId, at: AT },
      mobilityFuturesScenario,
    );
    expect(state.choices).toHaveLength(1);
    expect(
      state.agencyTimeline.some(
        (e) => e.actor === "PARTICIPANT" && e.action.startsWith("Chose:"),
      ),
    ).toBe(true);
  });
});

describe("Replay preserves prior runs", () => {
  it("REPLAY starts a new runId without clearing external history", () => {
    const engine = createScenarioEngine(mobilityFuturesScenario, "INFORM");
    engine.dispatch({
      type: "START",
      autonomyMode: "INFORM",
      runId: "run-a",
      at: AT,
    });
    let state = engine.getState();
    while (state.phase === "RUNNING") {
      state = engine.dispatch({ type: "CONTINUE", at: AT });
    }
    while (state.phase === "DECISION_REQUIRED") {
      state = engine.dispatch({
        type: "PARTICIPANT_CHOICE",
        optionId: state.pendingDecision!.options[0]!.id,
        at: AT,
      });
      while (state.phase === "RUNNING") {
        state = engine.dispatch({ type: "CONTINUE", at: AT });
      }
    }
    expect(state.phase).toBe("COMPLETED");
    const firstResult = engine.getResult(mobilityFuturesExperiment.id);
    expect(firstResult?.runId).toBe("run-a");

    state = engine.dispatch({
      type: "REPLAY",
      autonomyMode: "SUGGEST",
      runId: "run-b",
      at: AT,
    });
    expect(state.runId).toBe("run-b");
    expect(state.autonomyMode).toBe("SUGGEST");
    expect(state.choices).toHaveLength(0);
    // Previous result object remains distinct
    expect(firstResult?.runId).toBe("run-a");
  });
});

describe("Agency timeline and unknown evidence", () => {
  it("records ENVIRONMENT and SYSTEM actors", () => {
    const state = runToFirstDecision("SUGGEST");
    const actors = new Set(state.agencyTimeline.map((e) => e.actor));
    expect(actors.has("PARTICIPANT")).toBe(true);
    expect(actors.has("ENVIRONMENT")).toBe(true);
    expect(actors.has("SYSTEM")).toBe(true);
  });

  it("unknown route segment preserves UNKNOWN evidence state", () => {
    let state = runToFirstDecision("INFORM");
    // resolve first decision then reach crossing unknown
    state = reduceScenario(
      state,
      {
        type: "PARTICIPANT_CHOICE",
        optionId: state.pendingDecision!.options[0]!.id,
        at: AT,
      },
      mobilityFuturesScenario,
    );
    while (state.phase === "RUNNING") {
      state = reduceScenario(
        state,
        { type: "CONTINUE", at: AT },
        mobilityFuturesScenario,
      );
    }
    expect(state.pendingEvent?.type).toBe("UNKNOWN_ROUTE_SEGMENT");
    expect(state.pendingEvent?.evidenceState).toBe("UNKNOWN");
  });
});

describe("Simulation boundary", () => {
  it("forbids GAIS evidence-write import paths", () => {
    expect(isForbiddenGaisWriteImport("@/lib/gais/telemetry/store")).toBe(true);
    expect(
      isForbiddenGaisWriteImport(
        "@/lib/access/intelligence-next/evidence/persist",
      ),
    ).toBe(true);
    expect(isForbiddenGaisWriteImport("@/lib/labs/contracts")).toBe(false);
  });

  it("Labs runtime and experiment sources do not import GAIS write modules", () => {
    const roots = [
      join(process.cwd(), "lib/labs"),
      join(process.cwd(), "components/labs"),
      join(process.cwd(), "app/labs"),
    ];

    function walk(dir: string): string[] {
      const out: string[] = [];
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) out.push(...walk(p));
        else if (/\.(ts|tsx)$/.test(name)) out.push(p);
      }
      return out;
    }

    const importOf = (forbidden: string) =>
      new RegExp(
        String.raw`(?:from\s+|require\()\s*['"]${forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}['"]`,
      );

    const files = roots.flatMap(walk).filter((file) => !file.endsWith("/boundary.ts"));
    expect(files.length).toBeGreaterThan(5);

    const offenders: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const forbidden of FORBIDDEN_GAIS_WRITE_IMPORTS) {
        if (importOf(forbidden).test(source)) {
          offenders.push(`${file} -> ${forbidden}`);
        }
      }
      if (
        /(?:from\s+|require\()\s*['"][^'"]*(?:gais\/telemetry|evidence\/persist)[^'"]*['"]/.test(
          source,
        )
      ) {
        offenders.push(`${file} -> telemetry/persist import`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("contracts never include actuation commands", () => {
    for (const cmd of LABS_FORBIDDEN_ACTUATION_COMMANDS) {
      expect(labsContractsContainActuation(cmd)).toBe(true);
    }
    const contractSource = readFileSync(
      join(process.cwd(), "lib/labs/contracts/scenario.ts"),
      "utf8",
    );
    for (const cmd of ["steer", "drive", "accelerate", "brake", "moveJoint"]) {
      expect(contractSource.toLowerCase()).not.toContain(cmd.toLowerCase());
    }
  });
});
