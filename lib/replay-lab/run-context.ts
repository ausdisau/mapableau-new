import type { ReplayEventLedger } from "./event-ledger";
import type { ValidatedReplayScenario } from "./scenario-schema";
import type { SeededRandom } from "./seeded-random";
import type { ReplayActor } from "./types";
import type { VirtualClock } from "./virtual-clock";

export type ReplayRunContext = {
  clock: VirtualClock;
  ledger: ReplayEventLedger;
  random: SeededRandom;
  scenario: ValidatedReplayScenario;
  actors: Map<string, ReplayActor>;
};
