import type { SchedulingEngineType } from "@prisma/client";

import type { SchedulingProblem, SchedulingProposal } from "@/types/scheduling";

export interface SchedulingEngine {
  readonly engine: SchedulingEngineType;
  proposeAssignments(input: SchedulingProblem): Promise<SchedulingProposal>;
}

export class NotConfiguredSchedulingEngine implements SchedulingEngine {
  constructor(
    readonly engine: SchedulingEngineType,
    private readonly name: string
  ) {}

  async proposeAssignments(): Promise<SchedulingProposal> {
    throw new Error(`NOT_CONFIGURED:${this.name}`);
  }
}
