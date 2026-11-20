import Link from "next/link";

import { ProviderTransportScheduleClient } from "@/components/transport/schedule/ProviderTransportScheduleClient";
import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { requireAuth } from "@/lib/auth/guards";
import {
  isTransportScheduleMapEnabled,
  isTransportScheduleSocketEnabled,
} from "@/lib/config/transport-schedule";
import { getProviderScheduleMatrix } from "@/lib/transport/schedule/schedule-matrix-service";

export default async function ProviderTransportSchedulePage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0];
  if (!organisationId) {
    return (
      <p>You need to belong to a provider organisation to view the schedule.</p>
    );
  }

  const initialDay = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const matrix = await getProviderScheduleMatrix(user, organisationId, {
    day: initialDay,
  });

  return (
    <div className="space-y-4">
      <p>
        <Link
          href="/provider/transport/dispatch"
          className="text-sm text-primary hover:underline"
        >
          ← Dispatch board
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">Transport schedule</h1>
      <p className="max-w-3xl text-sm text-muted-foreground">
        Read-only calendar of trips, drivers, and vehicles. This page does not
        assign resources — use Dispatch for human assignment. Live GPS is off.
        Participant choice and verified vehicle fit remain hard gates.
      </p>
      <p className="text-sm">
        Need help with a no-match, cancellation, or incident? Use{" "}
        <Link
          href="/provider/transport/dispatch"
          className="text-primary underline-offset-2 hover:underline"
        >
          Dispatch recovery actions
        </Link>{" "}
        or your organisation&apos;s incident process. In an emergency call{" "}
        <strong>000</strong>.
      </p>
      <ProviderTransportScheduleClient
        organisationId={organisationId}
        initial={matrix}
        initialDay={initialDay}
        mapEnabled={isTransportScheduleMapEnabled()}
        socketEnabled={isTransportScheduleSocketEnabled()}
      />
    </div>
  );
}
