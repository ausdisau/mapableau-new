import {
  assertNeverBookable,
  buildCareCriteria,
  buildCareRecoveryProposals,
  preferredWorkerPreview,
  type CareDisruptionKind,
} from "@/lib/my-day-resilience/care-adapter";
import {
  CrossTenantAccessError,
  ImmutableEventLog,
} from "@/lib/my-day-resilience/events";
import {
  ACCESS_OBSERVATIONS,
  SYNTHETIC_TENANT_ID,
  createAlexWorkShopsReturnPlan,
  createConsentSnapshot,
} from "@/lib/my-day-resilience/fixtures";
import { MY_DAY_RESILIENCE_PERMANENT_DENY } from "@/lib/my-day-resilience/flags";
import { issueDecisionReceipt, replayFromEvents } from "@/lib/my-day-resilience/receipts";
import {
  buildBaselineTrip,
  buildTransportRecoveryProposals,
  evaluateTransportDisruption,
  type TransportDisruptionKind,
} from "@/lib/my-day-resilience/transport-adapter";
import type {
  ConsentSnapshot,
  DecisionReceipt,
  JourneyPhase,
  MyDayPlan,
  Proposal,
  ScenarioEvent,
  SourceEvidence,
  UserDecision,
  UserDecisionKind,
} from "@/lib/my-day-resilience/types";

export type MyDayResilienceState = {
  phase: JourneyPhase;
  consent: ConsentSnapshot;
  plan: MyDayPlan;
  evidence: SourceEvidence[];
  proposals: Proposal[];
  declinedProposalIds: string[];
  excludedWorkerIds: string[];
  decisions: UserDecision[];
  receipt: DecisionReceipt | null;
  blockReason?: string;
  careDisruption?: CareDisruptionKind;
  transportDisruption?: TransportDisruptionKind;
  transportRouteStatus?: "unknown" | "unavailable" | "delayed";
  nextActionLabel: string;
  productionClaim: "none";
  canBook: false;
  noOperationalChangeMade: true;
  permanentDeny: typeof MY_DAY_RESILIENCE_PERMANENT_DENY;
};

export class MyDayResilienceEngine {
  private readonly log: ImmutableEventLog;
  private state: MyDayResilienceState;

  constructor(options?: { consentGranted?: boolean; tenantId?: string }) {
    const consent = createConsentSnapshot(options?.consentGranted ?? true);
    if (options?.tenantId && options.tenantId !== consent.tenantId) {
      // Allow constructing with wrong tenant only to test isolation later.
      consent.tenantId = options.tenantId;
    }
    this.log = new ImmutableEventLog(consent.tenantId);
    const plan = createAlexWorkShopsReturnPlan();
    plan.tenantId = consent.tenantId;

    this.state = {
      phase: "consent_gate",
      consent,
      plan,
      evidence: [],
      proposals: [],
      declinedProposalIds: [],
      excludedWorkerIds: [],
      decisions: [],
      receipt: null,
      nextActionLabel: consent.granted
        ? "Confirm synthetic demo consent to continue"
        : "Consent denied — journey blocked",
      productionClaim: "none",
      canBook: false,
      noOperationalChangeMade: true,
      permanentDeny: MY_DAY_RESILIENCE_PERMANENT_DENY,
    };

    this.log.append("engine_created", {
      consentGranted: consent.granted,
      planId: plan.planId,
    });

    if (!consent.granted) {
      this.state.phase = "blocked";
      this.state.blockReason = "consent_denied";
      this.log.append("consent_denied", { purpose: consent.purpose });
    }
  }

  getState(): MyDayResilienceState {
    return {
      ...this.state,
      plan: {
        ...this.state.plan,
        steps: this.state.plan.steps.map((s) => ({ ...s })),
        dependencies: this.state.plan.dependencies.map((d) => ({ ...d })),
      },
      evidence: this.state.evidence.slice(),
      proposals: this.state.proposals.slice(),
      declinedProposalIds: this.state.declinedProposalIds.slice(),
      excludedWorkerIds: this.state.excludedWorkerIds.slice(),
      decisions: this.state.decisions.slice(),
      receipt: this.state.receipt ? { ...this.state.receipt } : null,
    };
  }

  getEvents(): readonly ScenarioEvent[] {
    return this.log.list();
  }

  assertTenantAccess(tenantId: string): void {
    this.log.assertTenant(tenantId);
    if (tenantId !== this.state.plan.tenantId) {
      throw new CrossTenantAccessError(tenantId, this.state.plan.tenantId);
    }
  }

  grantConsent(): MyDayResilienceState {
    this.ensureNotBlockedExceptConsent();
    if (this.state.phase !== "consent_gate" && this.state.phase !== "blocked") {
      return this.getState();
    }
    if (this.state.blockReason === "consent_denied" && !this.state.consent.granted) {
      // Explicit re-grant for demo only when starting denied and tester flips.
    }
    this.state.consent = {
      ...this.state.consent,
      granted: true,
      withdrawnAt: undefined,
      recordedAt: new Date().toISOString(),
    };
    this.state.phase = "plan_edit";
    this.state.blockReason = undefined;
    this.state.nextActionLabel = "Review or edit your synthetic My Day plan";
    this.log.append("consent_granted", { purpose: this.state.consent.purpose });
    return this.getState();
  }

  denyConsent(): MyDayResilienceState {
    this.state.consent = { ...this.state.consent, granted: false };
    this.state.phase = "blocked";
    this.state.blockReason = "consent_denied";
    this.state.proposals = [];
    this.state.nextActionLabel = "Consent denied — no further demo steps";
    this.log.append("consent_denied", { purpose: this.state.consent.purpose });
    return this.getState();
  }

  withdrawConsent(): MyDayResilienceState {
    this.state.consent = {
      ...this.state.consent,
      granted: false,
      withdrawnAt: new Date().toISOString(),
    };
    this.state.phase = "blocked";
    this.state.blockReason = "consent_withdrawn";
    this.state.proposals = [];
    this.state.nextActionLabel =
      "Consent withdrawn — downstream recovery options invalidated";
    this.log.append("consent_withdrawn", {
      invalidatedProposals: this.state.proposals.map((p) => p.id),
    });
    return this.getState();
  }

  updateGoal(goalStatement: string): MyDayResilienceState {
    this.requireConsentAndPhase(["plan_edit", "scenario_ready", "dependency_eval"]);
    this.state.plan = { ...this.state.plan, goalStatement };
    this.log.append("plan_goal_edited", { goalStatement });
    this.state.nextActionLabel = "Continue to dependency evaluation";
    return this.getState();
  }

  withdrawPreferredWorker(): MyDayResilienceState {
    this.requireConsent();
    const withdrawnId =
      this.state.plan.steps[0]?.preferredWorkerId ?? "example-a";
    this.state.excludedWorkerIds = [
      ...new Set([...this.state.excludedWorkerIds, withdrawnId]),
    ];
    this.state.plan = {
      ...this.state.plan,
      steps: this.state.plan.steps.map((step) => ({
        ...step,
        preferredWorkerId: undefined,
      })),
    };
    this.state.declinedProposalIds = [
      ...new Set([
        ...this.state.declinedProposalIds,
        "proposal_substitute_worker",
        "proposal_unsuitable_substitute",
      ]),
    ];
    this.state.proposals = this.state.proposals.filter(
      (p) => !this.state.declinedProposalIds.includes(p.id),
    );
    this.recordDecision(
      "withdraw_preference",
      undefined,
      "Preferred worker preference withdrawn",
    );
    this.log.append("preference_withdrawn", {
      excludedWorkerIds: this.state.excludedWorkerIds,
    });
    this.state.nextActionLabel =
      "Preferred worker preference withdrawn — dependent options invalidated";
    if (this.state.phase === "recovery_options" || this.state.phase === "human_escalation") {
      return this.buildRecoveryOptions();
    }
    return this.getState();
  }

  evaluateDependencies(): MyDayResilienceState {
    this.requireConsentAndPhase(["plan_edit", "dependency_eval"]);
    const criteria = this.careCriteria();
    const preferred = preferredWorkerPreview(criteria);
    if (preferred) assertNeverBookable(preferred);

    const trip = buildBaselineTrip({
      linkedStepIds: this.state.plan.steps.map((s) => s.id),
      requiresWheelchairAccessible: true,
    });

    this.state.evidence = [
      ...(preferred
        ? preferred.factors.map((f, i) => ({
            id: `pref_${i}`,
            topic: f.topic,
            honesty:
              f.state === "fictional_only"
                ? ("fictional" as const)
                : f.state === "needs_confirmation"
                  ? ("declared" as const)
                  : ("unknown" as const),
            summary: f.explanation,
            capabilityClaim: "in_development" as const,
          }))
        : []),
      ...ACCESS_OBSERVATIONS,
      ...trip.evidence,
    ];
    this.state.phase = "scenario_ready";
    this.state.nextActionLabel =
      "Inject the preferred-worker cancellation scenario";
    this.log.append("dependencies_evaluated", {
      stepCount: this.state.plan.steps.length,
      evidenceCount: this.state.evidence.length,
      tripId: trip.tripId,
      booked: trip.booked,
    });
    return this.getState();
  }

  injectPreferredWorkerCancellation(
    transportDisruption: TransportDisruptionKind = "delayed_pickup",
  ): MyDayResilienceState {
    this.requireConsentAndPhase(["scenario_ready", "disruption_injected"]);
    this.state.careDisruption = "preferred_worker_cancelled";
    this.state.transportDisruption = transportDisruption;

    const baseline = buildBaselineTrip({
      linkedStepIds: this.state.plan.steps.map((s) => s.id),
      requiresWheelchairAccessible: true,
    });
    const transport = evaluateTransportDisruption(transportDisruption, baseline);
    this.state.transportRouteStatus = transport.routeStatus;

    this.state.evidence = [...this.state.evidence, ...transport.evidence];
    this.state.phase = "disruption_injected";
    this.log.append("disruption_injected", {
      care: this.state.careDisruption,
      transport: transportDisruption,
      routeStatus: transport.routeStatus,
    });

    return this.buildRecoveryOptions();
  }

  private buildRecoveryOptions(): MyDayResilienceState {
    const careProposals = buildCareRecoveryProposals({
      criteria: this.careCriteria(),
      disruption: this.state.careDisruption ?? "preferred_worker_cancelled",
      declinedProposalIds: this.state.declinedProposalIds,
    });
    const transportProposals = buildTransportRecoveryProposals({
      disruption: this.state.transportDisruption ?? "delayed_pickup",
      declinedProposalIds: this.state.declinedProposalIds,
      routeStatus: this.state.transportRouteStatus ?? "delayed",
    });

    // Deduplicate by id (human escalation may appear in both).
    const byId = new Map<string, Proposal>();
    for (const p of [...careProposals, ...transportProposals]) {
      byId.set(p.id, p);
    }
    this.state.proposals = [...byId.values()];
    this.state.phase = "recovery_options";
    this.state.nextActionLabel =
      "Choose accept, decline, defer, or request human help";
    this.log.append("recovery_options_presented", {
      proposalIds: this.state.proposals.map((p) => p.id),
    });
    return this.getState();
  }

  applyDecision(
    kind: UserDecisionKind,
    proposalId?: string,
    note?: string,
  ): MyDayResilienceState {
    this.requireConsent();
    if (
      this.state.phase !== "recovery_options" &&
      this.state.phase !== "human_escalation" &&
      kind !== "revoke" &&
      kind !== "withdraw_preference"
    ) {
      throw new Error(`Decision not allowed in phase ${this.state.phase}`);
    }

    if (kind === "withdraw_preference") {
      return this.withdrawPreferredWorker();
    }

    if (kind === "revoke") {
      return this.withdrawConsent();
    }

    // Irreversible execute attempts are always blocked.
    if (note === "EXECUTE_BOOKING" || note === "EXECUTE_PAYMENT") {
      this.state.blockReason = "irreversible_blocked";
      this.log.append("irreversible_blocked", { kind, proposalId, note });
      this.state.nextActionLabel =
        "Irreversible action blocked — demo cannot book or pay";
      return this.getState();
    }

    this.recordDecision(kind, proposalId, note);

    if (kind === "decline" && proposalId) {
      this.state.declinedProposalIds = [
        ...new Set([...this.state.declinedProposalIds, proposalId]),
      ];
      this.state.proposals = this.state.proposals.filter((p) => p.id !== proposalId);
      this.log.append("proposal_declined", { proposalId });
      // Declined substitute must not reappear.
      this.state.proposals = this.state.proposals.filter(
        (p) => !this.state.declinedProposalIds.includes(p.id),
      );
      this.state.nextActionLabel =
        "Proposal declined and removed — choose another option or human help";
      if (
        this.state.proposals.every(
          (p) => p.kind === "human_coordination" || p.kind === "defer_activity",
        )
      ) {
        this.state.phase = "human_escalation";
        this.state.blockReason = "no_verified_option";
        this.state.nextActionLabel =
          "No verified alternative — human recovery route available";
        this.log.append("human_escalation", {
          reason: "no_verified_option_after_decline",
        });
      }
      return this.getState();
    }

    if (kind === "request_human_help" || proposalId?.includes("human_")) {
      this.state.phase = "human_escalation";
      this.state.nextActionLabel = "Human recovery route — review decision receipt";
      this.log.append("human_help_requested", { proposalId });
      return this.issueReceipt({
        chosenProposalId: proposalId ?? "proposal_human_care_escalation",
        escalationReason:
          "Participant requested human help; no verified autonomous alternative.",
      });
    }

    if (kind === "defer") {
      this.state.phase = "participant_approved";
      this.log.append("activity_deferred", { proposalId });
      return this.issueReceipt({
        chosenProposalId: proposalId ?? "proposal_defer_care",
      });
    }

    if (kind === "accept" && proposalId) {
      const proposal = this.state.proposals.find((p) => p.id === proposalId);
      if (!proposal) {
        throw new Error("Unknown or previously declined proposal");
      }
      if (proposal.canExecute !== false) {
        throw new Error("Proposal must never be executable");
      }
      if (proposal.verifiedInScenario) {
        // Still cannot book.
      }
      if (proposal.kind === "human_coordination") {
        this.state.phase = "human_escalation";
      } else {
        this.state.phase = "participant_approved";
      }
      this.log.append("proposal_accepted", {
        proposalId,
        verifiedInScenario: proposal.verifiedInScenario,
        canExecute: false,
      });
      return this.issueReceipt({
        chosenProposalId: proposalId,
        escalationReason:
          proposal.kind === "human_coordination"
            ? "Human coordination selected"
            : undefined,
      });
    }

    if (kind === "edit") {
      this.state.phase = "plan_edit";
      this.state.proposals = [];
      this.state.nextActionLabel = "Edit the synthetic plan, then re-evaluate";
      this.log.append("returned_to_plan_edit", {});
      return this.getState();
    }

    return this.getState();
  }

  private issueReceipt(input: {
    chosenProposalId?: string;
    escalationReason?: string;
  }): MyDayResilienceState {
    const receipt = issueDecisionReceipt({
      plan: this.state.plan,
      phase: this.state.phase,
      decisions: this.state.decisions,
      chosenProposalId: input.chosenProposalId,
      rejectedProposalIds: this.state.declinedProposalIds,
      evidence: this.state.evidence,
      escalationReason: input.escalationReason,
    });
    this.state.receipt = receipt;
    this.state.phase = "receipt_issued";
    this.state.nextActionLabel = "Review receipt or replay the scenario";
    this.log.append("receipt_issued", { receiptId: receipt.receiptId });
    this.state.phase = "replay_ready";
    this.log.append("replay_ready", { eventCount: this.log.list().length });
    return this.getState();
  }

  replay(): {
    events: ScenarioEvent[];
    reconstructedPhase: JourneyPhase;
    equalToLive: boolean;
  } {
    const events = this.log.snapshot();
    const reconstructed = replayFromEvents(events);
    return {
      events,
      reconstructedPhase: reconstructed.phase,
      equalToLive: reconstructed.phase === this.state.phase,
    };
  }

  offlineSummary(): string {
    const s = this.state;
    const lines = [
      "MapAble My Day Resilience — offline-readable synthetic summary",
      `Goal: ${s.plan.goalStatement}`,
      `Phase: ${s.phase}`,
      `Consent: ${s.consent.granted ? "granted" : "denied/withdrawn"} (${s.consent.purpose})`,
      `Steps: ${s.plan.steps.map((st) => st.label).join(" → ")}`,
      `Next action: ${s.nextActionLabel}`,
      `canBook: false | productionClaim: none | noOperationalChangeMade: true`,
      s.receipt
        ? `Receipt: ${s.receipt.receiptId}; rejected=${s.receipt.rejectedProposalIds.join(",") || "none"}; escalation=${s.receipt.escalationReason ?? "none"}`
        : "Receipt: not issued",
      "DEMO ONLY — fictional workers and transport. No bookings, payments, screening or government APIs.",
    ];
    return lines.join("\n");
  }

  private careCriteria() {
    const first = this.state.plan.steps[0];
    return buildCareCriteria({
      communicationNeeds: first?.communicationNeeds ?? ["aac"],
      preferredWorkerId: first?.preferredWorkerId ?? "example-a",
      excludedWorkerIds: this.state.excludedWorkerIds,
    });
  }

  private recordDecision(
    kind: UserDecisionKind,
    proposalId?: string,
    note?: string,
  ): void {
    const decision: UserDecision = {
      id: `decision_${this.state.decisions.length}`,
      kind,
      proposalId,
      note,
      at: new Date().toISOString(),
    };
    this.state.decisions = [...this.state.decisions, decision];
    this.log.append("user_decision", { ...decision });
  }

  private requireConsent(): void {
    if (!this.state.consent.granted || this.state.consent.withdrawnAt) {
      this.state.phase = "blocked";
      this.state.blockReason = this.state.consent.withdrawnAt
        ? "consent_withdrawn"
        : "consent_denied";
      throw new Error(`CONSENT_REQUIRED: ${this.state.blockReason}`);
    }
  }

  private requireConsentAndPhase(phases: JourneyPhase[]): void {
    this.requireConsent();
    if (!phases.includes(this.state.phase)) {
      throw new Error(
        `Invalid phase ${this.state.phase}; expected one of ${phases.join(",")}`,
      );
    }
  }

  private ensureNotBlockedExceptConsent(): void {
    if (
      this.state.phase === "blocked" &&
      this.state.blockReason !== "consent_denied"
    ) {
      throw new Error(`Journey blocked: ${this.state.blockReason}`);
    }
  }
}

export function createDemoEngine(consentGranted = true): MyDayResilienceEngine {
  const engine = new MyDayResilienceEngine({
    consentGranted,
    tenantId: SYNTHETIC_TENANT_ID,
  });
  return engine;
}
