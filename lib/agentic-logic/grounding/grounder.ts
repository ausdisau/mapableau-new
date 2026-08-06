import { factRegistry } from "../registry/factRegistry";
import { Fact } from "../contracts/fact";

export type GroundingConfig = {
  tenantId: string;
  participantId?: string;
  missionId?: string;
  purpose?: string;
  timeWindowStart?: string; // ISO
  timeWindowEnd?: string; // ISO
  maxCandidates?: number;
};

export class Grounder {
  constructor(private cfg: GroundingConfig) {}

  // returns facts filtered by tenant, consent and scope
  public groundFacts(): Fact[] {
    // Access the fact registry internals in a safe, defensive way
    const entries = (factRegistry as any).byId ? Array.from((factRegistry as any).byId.values()) : [] as Fact[];

    const filtered = entries.filter((f: Fact) => {
      if (f.tenantId !== this.cfg.tenantId) return false; // tenant isolation
      if (f.consent && f.consent.granted === false) return false; // consent revoked
      if (this.cfg.purpose && f.consent && f.consent.purpose && f.consent.purpose !== this.cfg.purpose) return false;
      // scope restriction - if missionId set, ensure fact scope matches or is undefined
      if (this.cfg.missionId && f.scope && f.scope.missionId && f.scope.missionId !== this.cfg.missionId) return false;
      return true;
    });

    if (this.cfg.maxCandidates) return filtered.slice(0, this.cfg.maxCandidates);
    return filtered;
  }
}

export default Grounder;