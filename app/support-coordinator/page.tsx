import Link from "next/link";

import { RequestProgressTimeline } from "@/components/wedges/request-tracker/RequestProgressTimeline";
import { ResponseTimeBadge } from "@/components/wedges/trust/ResponseTimeBadge";
import { AccessFitSummary } from "@/components/wedges/access-fit/AccessFitSummary";
import { ProviderAvailabilityCard } from "@/components/wedges/availability/ProviderAvailabilityCard";
import { accessFitScore } from "@/lib/access-fit/score";
import { requirePermission } from "@/lib/auth/guards";
import { wedgesConfig } from "@/lib/config/wedges";
import {
  DEMO_ACCESS_PROFILE,
  MOCK_COORDINATOR_PARTICIPANTS,
  MOCK_COORDINATOR_TASKS,
  MOCK_REQUEST_PROGRESS,
  MOCK_RESPONSE_SLA,
  MOCK_WEDGE_PROVIDERS,
} from "@/lib/wedges/mock-providers";

export default async function SupportCoordinatorDashboardPage() {
  await requirePermission("coordinator:portal");

  const showOs = wedgesConfig.coordinatorOsEnabled;

  return (
    <div className="space-y-8 p-4">
      <header>
        <h1 className="font-heading text-2xl font-bold">Support coordinator portal</h1>
        <p className="text-muted-foreground">
          Access is consent-based. You only see information participants have authorised.
        </p>
      </header>

      {showOs ? (
        <>
          <section aria-labelledby="participants-heading">
            <h2 id="participants-heading" className="font-heading text-lg font-semibold">
              Participants
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[32rem] border-collapse text-sm">
                <caption className="sr-only">Participant list</caption>
                <thead>
                  <tr className="border-b text-left">
                    <th scope="col" className="p-2 font-medium">
                      Name
                    </th>
                    <th scope="col" className="p-2 font-medium">
                      Suburb
                    </th>
                    <th scope="col" className="p-2 font-medium">
                      Goals
                    </th>
                    <th scope="col" className="p-2 font-medium">
                      Active requests
                    </th>
                    <th scope="col" className="p-2 font-medium">
                      Consent
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_COORDINATOR_PARTICIPANTS.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="p-2">
                        <Link
                          href={`/support-coordinator/participants/${p.id}`}
                          className="text-primary underline"
                        >
                          {p.alias}
                        </Link>
                      </td>
                      <td className="p-2">{p.suburb}</td>
                      <td className="p-2">{p.goals}</td>
                      <td className="p-2">{p.activeRequests}</td>
                      <td className="p-2">{p.consentStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="tasks-heading">
            <h2 id="tasks-heading" className="font-heading text-lg font-semibold">
              Service requests
            </h2>
            <ul className="mt-4 space-y-3">
              {MOCK_COORDINATOR_TASKS.map((task) => (
                <li
                  key={task.id}
                  className="rounded-lg border border-border p-4"
                >
                  <p className="font-medium">{task.participantAlias}</p>
                  <p className="text-sm text-muted-foreground">
                    {task.category} · {task.urgency.replace(/_/g, " ")} ·{" "}
                    {task.status.replace(/_/g, " ")}
                  </p>
                  <p className="mt-1 text-sm">
                    Shortlist: {task.shortlistCount} · Next: {task.nextAction}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="shortlist-heading">
            <h2 id="shortlist-heading" className="font-heading text-lg font-semibold">
              Provider shortlist (demo)
            </h2>
            <ul className="mt-4 space-y-6">
              {MOCK_WEDGE_PROVIDERS.slice(0, 2).map((provider) => (
                <li key={provider.id} className="space-y-3 rounded-lg border p-4">
                  <h3 className="font-medium">{provider.name}</h3>
                  <ProviderAvailabilityCard availability={provider.availability} compact />
                  <AccessFitSummary
                    result={accessFitScore(
                      DEMO_ACCESS_PROFILE,
                      provider.accessCapabilities,
                    )}
                    showDetails={false}
                  />
                  {MOCK_RESPONSE_SLA[provider.id] ? (
                    <ResponseTimeBadge sla={MOCK_RESPONSE_SLA[provider.id]} />
                  ) : null}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="timeline-heading">
            <h2 id="timeline-heading" className="font-heading text-lg font-semibold">
              Task board
            </h2>
            <RequestProgressTimeline progress={MOCK_REQUEST_PROGRESS[0]} />
          </section>

          <section aria-labelledby="consent-heading" className="rounded-lg bg-muted/40 p-4">
            <h2 id="consent-heading" className="font-heading text-lg font-semibold">
              Consent and sharing
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Demo: participants control who can see care, billing, and access profile
              sections. Revoke and expiry controls connect to the consent module.
            </p>
            <Link href="/dashboard/consent" className="mt-2 inline-block text-sm text-primary underline">
              Manage consent records
            </Link>
          </section>
        </>
      ) : (
        <nav aria-label="Coordinator sections">
          <ul className="flex flex-col gap-3">
            <li>
              <Link className="text-primary underline" href="/support-coordinator/participants">
                Participants
              </Link>
            </li>
            <li>
              <Link className="text-primary underline" href="/support-coordinator/tasks">
                Tasks
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
