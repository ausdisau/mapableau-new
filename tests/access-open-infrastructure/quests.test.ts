import { afterEach, describe, expect, it } from "vitest";

import {
  __resetQuestIdempotencyForTests,
  AccessQuestError,
  normalizeQuestAnswer,
} from "@/lib/access/quests/submit";
import { prioritiseQuests, scoreQuestPriority } from "@/lib/access/quests/prioritisation";
import { listAccessQuests } from "@/lib/access/quests/types";

describe("access quests", () => {
  afterEach(() => {
    delete process.env.MAPABLE_OPEN_INFRASTRUCTURE_ENABLED;
    delete process.env.MAPABLE_ACCESS_QUESTS_ENABLED;
    __resetQuestIdempotencyForTests();
  });

  it("maps unknown answers without claiming capability", async () => {
    process.env.MAPABLE_OPEN_INFRASTRUCTURE_ENABLED = "true";
    process.env.MAPABLE_ACCESS_QUESTS_ENABLED = "true";

    const obs = normalizeQuestAnswer({
      questId: "entrance.step_free",
      value: "unknown",
      lat: -33.87,
      lng: 151.21,
      idempotencyKey: "idem-quest-1",
      actorRef: "test-actor",
    });
    expect(obs.value).toBe("UNKNOWN");
    expect(obs.claimStrength).toBe("observation");
  });

  it("rejects duplicate idempotency keys", () => {
    process.env.MAPABLE_OPEN_INFRASTRUCTURE_ENABLED = "true";
    process.env.MAPABLE_ACCESS_QUESTS_ENABLED = "true";

    const payload = {
      questId: "entrance.step_free",
      value: "yes" as const,
      lat: -33.87,
      lng: 151.21,
      idempotencyKey: "idem-quest-dup",
      actorRef: "test-actor",
    };
    normalizeQuestAnswer(payload);
    expect(() => normalizeQuestAnswer(payload)).toThrow(AccessQuestError);
  });

  it("prioritises by evidence quality signals", () => {
    const quests = listAccessQuests().slice(0, 2);
    const scored = scoreQuestPriority(quests[0], {
      missingCriticalEvidence: true,
      staleEvidence: false,
      conflictingObservations: false,
      highUseLocation: false,
      journeyCritical: false,
      communityRequestedVerification: false,
    });
    expect(scored).toBeGreaterThan(quests[0].priorityWeight);

    const ordered = prioritiseQuests(quests, {
      [quests[0].id]: {
        missingCriticalEvidence: true,
        staleEvidence: false,
        conflictingObservations: false,
        highUseLocation: false,
        journeyCritical: false,
        communityRequestedVerification: false,
      },
      [quests[1].id]: {
        missingCriticalEvidence: false,
        staleEvidence: false,
        conflictingObservations: false,
        highUseLocation: false,
        journeyCritical: false,
        communityRequestedVerification: false,
      },
    });
    expect(ordered[0].id).toBe(quests[0].id);
  });
});
