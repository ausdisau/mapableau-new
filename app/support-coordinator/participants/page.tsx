import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { listCoordinatorCaseload } from "@/lib/care-support/coordination-service";

export default async function CoordinatorParticipantsPage() {
  const user = await requirePermission("coordinator:portal");
  const caseload = await listCoordinatorCaseload(user.id);

  return (
    <div className="space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">Participants</h1>
      <p className="text-muted-foreground">
        Consent-based caseload. Only participants who have authorised your access are listed.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
          <caption className="sr-only">Coordinator participant caseload</caption>
          <thead>
            <tr className="border-b">
              <th scope="col" className="py-2 pr-4 font-semibold">
                Participant
              </th>
              <th scope="col" className="py-2 pr-4 font-semibold">
                Assessment
              </th>
              <th scope="col" className="py-2 pr-4 font-semibold">
                Open referrals
              </th>
              <th scope="col" className="py-2 font-semibold">
                Open tasks
              </th>
            </tr>
          </thead>
          <tbody>
            {caseload.map((row) => (
              <tr key={row.participantId} className="border-b">
                <td className="py-3 pr-4">
                  <Link
                    href={`/support-coordinator/participants/${row.participantId}`}
                    className="font-medium text-primary underline"
                  >
                    {row.participant?.name ?? row.participantId}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {row.latestAssessment?.status ?? "—"}
                </td>
                <td className="py-3 pr-4">{row.openReferralCount}</td>
                <td className="py-3">{row.openTasks}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {caseload.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No active participant relationships. Participants must approve your access request.
          </p>
        ) : null}
      </div>

      <Link href="/support-coordinator" className="text-sm text-primary underline">
        Back to coordinator home
      </Link>
    </div>
  );
}
