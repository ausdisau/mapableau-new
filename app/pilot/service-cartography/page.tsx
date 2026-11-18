import Link from "next/link";

import {
  isServiceCartographyPilotEnabled,
  runGoldenSlice,
  serviceCartographyConfig,
} from "@/lib/pilot/service-cartography";

import { CartographyControls } from "./CartographyControls";

export default async function ServiceCartographyPilotPage() {
  if (!isServiceCartographyPilotEnabled()) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-6">
        <h1 className="text-2xl font-bold">Service Cartography pilot</h1>
        <p className="text-muted-foreground">
          Pilot is disabled. Set{" "}
          <code>MAPABLE_SERVICE_CARTOGRAPHY_PILOT=true</code> for the
          synthetic community-visit advisory preview.
        </p>
      </main>
    );
  }

  const slice = await runGoldenSlice({});

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Service Cartography — community visit</h1>
        <p className="text-muted-foreground">
          Synthetic accessible community visit with optional care and transport.
          Ranked options are advisory only and never become bookings.
        </p>
        <p className="text-xs text-muted-foreground" data-testid="honesty-line">
          Public claim: none · syntheticOnly=
          {String(serviceCartographyConfig.syntheticOnly)} · autoAssignment=
          {String(slice.autoAssignment)} · isBooking={String(slice.isBooking)}
        </p>
      </header>

      <section aria-labelledby="goal-heading" className="space-y-2">
        <h2 id="goal-heading" className="text-lg font-semibold">
          Consented synthetic goal
        </h2>
        <p className="text-sm" data-testid="participant-goal">
          Goal: {slice.goal}
        </p>
        <p className="text-sm" data-testid="slice-status">
          Status: {slice.blocked ? `blocked (${slice.blockReason ?? "unknown"})` : "advisory"}
        </p>
      </section>

      <section aria-labelledby="options-heading" className="space-y-2">
        <h2 id="options-heading" className="text-lg font-semibold">
          Advisory service choices
        </h2>
        <p className="text-sm" data-testid="matching-status">
          Matching: {slice.matching.status}
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-sm" data-testid="ranked-options">
          {slice.matching.ranked.map((option) => (
            <li key={option.offerId}>
              {option.providerId} · score {option.score} · evidence{" "}
              {option.evidenceSourceId} · confirmation required
            </li>
          ))}
        </ol>
        {slice.matching.exclusions.length > 0 ? (
          <ul className="space-y-1 text-sm text-muted-foreground" data-testid="exclusions">
            {slice.matching.exclusions.map((exclusion) => (
              <li key={exclusion.offerId}>
                Excluded {exclusion.offerId}: {exclusion.reasons.join(", ")}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section aria-labelledby="deps-heading" className="space-y-2">
        <h2 id="deps-heading" className="text-lg font-semibold">
          Dependencies and uncertainties
        </h2>
        <p className="text-sm" data-testid="graph-status">
          Graph: {slice.graph.status}
        </p>
        <ul className="space-y-1 text-sm" data-testid="missing-dependencies">
          {slice.missingDependencyExplanations.map((explanation) => (
            <li key={explanation}>{explanation}</li>
          ))}
        </ul>
        <p className="text-sm" data-testid="route-status">
          Route: {slice.route.status}
          {slice.route.requiresRealWorldConfirmation
            ? " · real-world confirmation still required"
            : ""}
        </p>
        <p className="text-sm" data-testid="schedule-status">
          Schedule proposals: {slice.schedule.proposals.length} (not booked)
        </p>
        <p className="text-sm" data-testid="continuity-status">
          Continuity alerts: {slice.continuity.length}
        </p>
      </section>

      <section aria-labelledby="review-heading" className="space-y-2">
        <h2 id="review-heading" className="text-lg font-semibold">
          Human review required
        </h2>
        <p className="text-sm" data-testid="advisory-meta">
          Disposition {slice.advisory.disposition}. Participant confirmation:{" "}
          {String(slice.advisory.requiresParticipantConfirmation)}. Human review:{" "}
          {String(slice.advisory.requiresHumanReview)}.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm" data-testid="notices">
          {slice.notices.map((notice) => (
            <li key={notice}>{notice}</li>
          ))}
        </ul>
      </section>

      <CartographyControls />

      <p className="text-xs text-muted-foreground">
        Experimental reference algorithms. See{" "}
        <Link className="underline" href="/dashboard/consent">
          Consent centre
        </Link>
        . This page cannot create Care, Transport, or Billing records.
      </p>
    </main>
  );
}
