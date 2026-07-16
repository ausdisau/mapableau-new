import { describe, expect, it } from "vitest";

import {
  dependencyProjectionAsList,
  projectDependenciesFromTemplate,
} from "@/lib/continuity-os/dependencies/projection";
import { requireLifeEventType } from "@/lib/continuity-os/taxonomy/registry";

describe("Dependency projection", () => {
  const definition = requireLifeEventType("start_job");

  it("preserves participant goal and unknowns", () => {
    const projection = projectDependenciesFromTemplate({
      definition,
      participantGoal: "Start work at Harbour Civic Centre before 8:45",
      unknowns: ["reception_or_first_day_assistance"],
    });

    const goal = projection.nodes.find((n) => n.code === "participant_goal");
    expect(goal?.state).toBe("confirmed");
    expect(projection.unknowns).toContain("reception_or_first_day_assistance");
    expect(projection.responsibilities.length).toBeGreaterThan(0);
    expect(
      projection.responsibilities.every((r) => r.decisionAuthority === "participant")
    ).toBe(true);
  });

  it("marks transport as a single point of failure when unconfirmed", () => {
    const projection = projectDependenciesFromTemplate({
      definition,
      participantGoal: "Start work",
    });
    expect(projection.singlePointsOfFailure).toContain("accessible_transport");
  });

  it("provides a structured list alternative", () => {
    const projection = projectDependenciesFromTemplate({
      definition,
      participantGoal: "Start work",
    });
    const list = dependencyProjectionAsList(projection);
    expect(list[0]).toHaveProperty("label");
    expect(list[0]).toHaveProperty("state");
    expect(list[0]).toHaveProperty("owner");
  });

  it("keeps first_day_adjustment unknown unless confirmed", () => {
    const projection = projectDependenciesFromTemplate({
      definition,
      participantGoal: "Start work",
    });
    const adj = projection.nodes.find((n) => n.code === "first_day_adjustment");
    expect(adj?.state).toBe("unknown");
  });
});
