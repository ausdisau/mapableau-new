"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { careIntelligenceHealth } from "@/lib/care-intelligence/config";
import type { evaluateCsiAgiKernel } from "@/lib/care-intelligence/kernel/evaluation";
import type { CsiAgiKernelRun } from "@/lib/care-intelligence/kernel/types";
import type { listScenarioSummaries } from "@/lib/care-intelligence/scenarios";
import type {
  CoordinationRun,
  EvaluationReport,
} from "@/lib/care-intelligence/types";

type Health = ReturnType<typeof careIntelligenceHealth>;
type ScenarioSummary = ReturnType<typeof listScenarioSummaries>[number];
type KernelEvaluation = ReturnType<typeof evaluateCsiAgiKernel>;

export function CareIntelligenceCockpit({
  health,
  scenarios,
}: {
  health: Health;
  scenarios: ScenarioSummary[];
}) {
  const [scenarioId, setScenarioId] = useState(scenarios[0]?.id ?? "");
  const [run, setRun] = useState<CoordinationRun | null>(null);
  const [kernel, setKernel] = useState<CsiAgiKernelRun | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationReport | null>(null);
  const [kernelEvaluation, setKernelEvaluation] =
    useState<KernelEvaluation | null>(null);
  const [pending, setPending] = useState<"run" | "evaluate" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ready = health.status === "ready";

  async function deliberate() {
    setPending("run");
    setError(null);
    try {
      const response = await fetch("/api/intelligence/csi/kernel/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId }),
      });
      const payload = (await response.json()) as {
        kernel?: CsiAgiKernelRun;
        error?: string;
      };
      if (!response.ok || !payload.kernel)
        throw new Error(payload.error ?? "The kernel cycle failed.");
      setKernel(payload.kernel);
      setRun(payload.kernel.coordination);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The run failed.");
    } finally {
      setPending(null);
    }
  }

  async function evaluate() {
    setPending("evaluate");
    setError(null);
    try {
      const response = await fetch("/api/intelligence/csi/kernel/evaluation");
      const payload = (await response.json()) as {
        evaluation?: EvaluationReport;
        kernelEvaluation?: KernelEvaluation;
        error?: string;
      };
      if (!response.ok || !payload.evaluation || !payload.kernelEvaluation)
        throw new Error(payload.error ?? "The evaluation failed.");
      setEvaluation(payload.evaluation);
      setKernelEvaluation(payload.kernelEvaluation);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "The evaluation failed.",
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-6">
      <section
        aria-label="Research boundary"
        className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold">Synthetic deliberation only</p>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Five deterministic specialists may observe, compare and explain.
              Only the locked rights policy can expose a plan. No execution port
              exists.
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-bold ${
              ready
                ? "bg-emerald-100 text-emerald-900"
                : "bg-amber-100 text-amber-950"
            }`}
          >
            {ready ? "Lab ready" : `Lab ${health.status}`}
          </span>
        </div>
      </section>

      <Card variant="gradient">
        <CardHeader>
          <CardTitle>Research scenario</CardTitle>
          <CardDescription>
            Select a fixed adversarial scenario. Arbitrary prompts and real
            participant identifiers are not accepted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-2xl space-y-2">
            <label htmlFor="csi-scenario" className="text-sm font-bold">
              Synthetic scenario
            </label>
            <select
              id="csi-scenario"
              value={scenarioId}
              onChange={(event) => {
                setScenarioId(event.target.value);
                setRun(null);
                setKernel(null);
              }}
              className="min-h-12 w-full rounded-xl border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.title} — expected {scenario.expectedDecision}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">
              {
                scenarios.find((scenario) => scenario.id === scenarioId)
                  ?.researchQuestion
              }
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="default"
              size="default"
              loading={pending === "run"}
              disabled={!ready || !scenarioId}
              onClick={deliberate}
            >
              Run CSI-AGI kernel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="default"
              loading={pending === "evaluate"}
              disabled={!ready}
              onClick={evaluate}
            >
              Evaluate kernel
            </Button>
          </div>
          <div aria-live="polite" aria-atomic="true">
            {error ? (
              <p role="alert" className="text-sm font-bold text-destructive">
                {error}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {kernel ? <KernelResult kernel={kernel} /> : null}
      {run ? <RunResult run={run} /> : null}
      {evaluation && kernelEvaluation ? (
        <EvaluationResult
          evaluation={evaluation}
          kernelEvaluation={kernelEvaluation}
        />
      ) : null}
    </div>
  );
}

function KernelResult({ kernel }: { kernel: CsiAgiKernelRun }) {
  return (
    <section aria-labelledby="kernel-result-title" className="space-y-4">
      <Card variant="gradient">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle id="kernel-result-title">CSI-AGI kernel</CardTitle>
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold ${
                kernel.phase === "completed"
                  ? "bg-emerald-100 text-emerald-900"
                  : "bg-amber-100 text-amber-950"
              }`}
            >
              {kernel.phase}
            </span>
          </div>
          <CardDescription>
            Version {kernel.kernelVersion} · {kernel.cyclesCompleted}/
            {kernel.maxCycles} cognitive cycles · audit{" "}
            {kernel.auditVerification.valid ? "verified" : "invalid"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Metric label="Goals" value={kernel.goals.length} />
            <Metric label="Beliefs" value={kernel.beliefs.length} />
            <Metric
              label="Capabilities"
              value={kernel.capabilityRegistry.length}
            />
            <Metric label="Commitments" value={kernel.commitments.length} />
            <Metric label="Audit events" value={kernel.audit.length} />
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card variant="outlined">
          <CardHeader>
            <CardTitle>Kernel invariants</CardTitle>
            <CardDescription>
              Every invariant must pass before a commitment can be exposed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {kernel.invariants.map((invariant) => (
                <li
                  key={invariant.id}
                  className="flex items-start justify-between gap-4 rounded-lg bg-muted/50 p-2"
                >
                  <span>
                    <strong>{invariant.id.replaceAll("_", " ")}</strong>
                    <span className="mt-0.5 block text-muted-foreground">
                      {invariant.detail}
                    </span>
                  </span>
                  <span
                    className={
                      invariant.passed
                        ? "font-bold text-emerald-700"
                        : "font-bold text-destructive"
                    }
                  >
                    {invariant.passed ? "pass" : "fail"}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardHeader>
            <CardTitle>Metacognition</CardTitle>
            <CardDescription>
              Bounded self-assessment of evidence and uncertainty—not
              self-modification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <dl className="space-y-2">
              <Row
                label="Calibrated confidence"
                value={`${Math.round(kernel.metacognition.calibratedConfidence * 100)}%`}
              />
              <Row
                label="Evidence coverage"
                value={`${Math.round(kernel.metacognition.evidenceCoverage * 100)}%`}
              />
              <Row
                label="Human review"
                value={
                  kernel.metacognition.humanReviewRequired
                    ? "required"
                    : "not required"
                }
              />
            </dl>
            <p className="rounded-lg bg-muted/50 p-3">
              {kernel.metacognition.humanReviewReason}
            </p>
            {kernel.metacognition.unresolvedUncertainties.length ? (
              <ul className="list-disc space-y-1 pl-5 text-amber-900">
                {kernel.metacognition.unresolvedUncertainties.map(
                  (uncertainty) => (
                    <li key={uncertainty}>{uncertainty}</li>
                  ),
                )}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Capability invocations</CardTitle>
          <CardDescription>
            The registry contains read, reason, simulate, prepare and audit
            capabilities only. Every capability is participant-scoped and
            side-effect-free.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-2 md:grid-cols-2">
            {kernel.capabilityInvocations.map((invocation) => (
              <li
                key={`${invocation.sequence}-${invocation.capabilityId}`}
                className="rounded-xl border p-3 text-sm"
              >
                <p className="font-bold">
                  {invocation.sequence}. {invocation.capabilityId}
                </p>
                <p className="mt-1 text-xs font-black uppercase tracking-wide text-primary">
                  {invocation.phase} · {invocation.outcome}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {invocation.summary}
                </p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </section>
  );
}

function RunResult({ run }: { run: CoordinationRun }) {
  return (
    <section aria-labelledby="csi-result-title" className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle id="csi-result-title">Deliberation result</CardTitle>
            <DecisionBadge decision={run.decision} />
          </div>
          <CardDescription>{run.participantMessage}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Active goals"
              value={run.worldStateSummary.activeGoals}
            />
            <Metric label="Evidence records" value={run.evidence.length} />
            <Metric
              label="Memory writes"
              value={run.boundaries.persistentMemoryWrites}
            />
            <Metric
              label="Real-world actions"
              value={run.boundaries.realWorldActions}
            />
          </dl>
        </CardContent>
      </Card>

      {run.agentDisagreement.present ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
          <p className="font-bold">A meaningful trade-off needs your choice</p>
          <p className="mt-1 text-sm">{run.agentDisagreement.summary}</p>
        </div>
      ) : null}

      <div>
        <h2 className="text-xl font-bold">Specialist observations</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          These are evidence-backed summaries, not hidden reasoning or
          authority.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {run.specialistObservations.map((observation) => (
            <Card key={observation.agent} variant="outlined">
              <CardHeader className="pb-3">
                <CardTitle className="capitalize">
                  {observation.agent}
                </CardTitle>
                <CardDescription>
                  {observation.status} ·{" "}
                  {Math.round(observation.confidence * 100)}% evidence
                  confidence
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                {observation.summary}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold">Simulated recovery plans</h2>
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          {run.plans.length ? (
            run.plans.map((plan) => (
              <Card key={plan.id} variant="gradient">
                <CardHeader>
                  <CardTitle>Option {plan.rank}</CardTitle>
                  <CardDescription>
                    Goal fit {plan.counterfactual.utility}/100 · uncertainty{" "}
                    {Math.round(plan.counterfactual.uncertainty * 100)}%
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <dl className="space-y-2">
                    <Row
                      label="Worker"
                      value={
                        plan.worker?.displayName ?? "Existing worker unchanged"
                      }
                    />
                    <Row
                      label="Vehicle"
                      value={
                        plan.vehicle?.displayName ??
                        "Existing vehicle unchanged"
                      }
                    />
                    <Row
                      label="Time change"
                      value={`${plan.counterfactual.timeShiftMinutes} minutes`}
                    />
                    <Row
                      label="Price change"
                      value={formatCurrency(
                        plan.counterfactual.priceDeltaCents,
                      )}
                    />
                  </dl>
                  {plan.concerns.length ? (
                    <ul className="list-disc space-y-1 pl-5 text-amber-900">
                      {plan.concerns.map((concern) => (
                        <li key={concern}>{concern}</li>
                      ))}
                    </ul>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    disabled
                    aria-describedby={`${plan.id}-gate-note`}
                  >
                    Confirm option
                  </Button>
                  <p
                    id={`${plan.id}-gate-note`}
                    className="text-xs text-muted-foreground"
                  >
                    Disabled in the synthetic lab. No booking or message can be
                    executed.
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No plan is exposed for this policy outcome.
            </p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Locked policy record</CardTitle>
          <CardDescription>
            The policy cannot be changed by specialist output or candidate text.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold">Rules applied</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {run.policy.ruleIds.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold">Required next steps</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {run.policy.requiredNextSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deliberation graph</CardTitle>
          <CardDescription>
            Inspectable stage summaries with evidence references; no private
            chain-of-thought is stored or shown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {run.deliberationGraph.map((node) => (
              <li key={node.id} className="rounded-xl border p-3">
                <p className="text-xs font-black uppercase tracking-wide text-primary">
                  {node.stage} · {node.status}
                </p>
                <p className="mt-1 font-bold">{node.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {node.summary}
                </p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </section>
  );
}

function EvaluationResult({
  evaluation,
  kernelEvaluation,
}: {
  evaluation: EvaluationReport;
  kernelEvaluation: KernelEvaluation;
}) {
  return (
    <Card variant="outlined">
      <CardHeader>
        <CardTitle>Adversarial evaluation</CardTitle>
        <CardDescription>
          {evaluation.passedScenarios}/{evaluation.totalScenarios} scenarios
          passed · {evaluation.hardBoundaryViolations} hard-boundary violations
          · {evaluation.evidenceIntegrityFailures} evidence-integrity failures ·{" "}
          {kernelEvaluation.invariantFailures} kernel invariant failures ·{" "}
          {kernelEvaluation.auditFailures} audit-chain failures
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p
          className={`font-bold ${
            evaluation.passed && kernelEvaluation.passed
              ? "text-emerald-700"
              : "text-destructive"
          }`}
        >
          {evaluation.passed && kernelEvaluation.passed
            ? "Evaluation gate passed"
            : "Evaluation gate failed"}
        </p>
      </CardContent>
    </Card>
  );
}

function DecisionBadge({
  decision,
}: {
  decision: CoordinationRun["decision"];
}) {
  const positive = decision === "monitor" || decision === "propose";
  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-bold ${
        positive
          ? "bg-emerald-100 text-emerald-900"
          : "bg-amber-100 text-amber-950"
      }`}
    >
      {decision}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted/60 p-3">
      <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-black">{value}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="font-semibold text-muted-foreground">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(cents / 100);
}
