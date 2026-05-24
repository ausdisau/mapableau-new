"use client";

import Link from "next/link";

import { MapAbleStatusBadge } from "@/components/shared/MapAbleModuleUi";

export type CaseloadRow = {
  participantId: string;
  relationshipId: string;
  status: string;
  consentActive: boolean;
  displayName: string;
  homeSuburb?: string | null;
};

export function CaseloadTable({ rows }: { rows: CaseloadRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No participants linked yet. Access is consent-based.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">Support coordinator caseload</caption>
        <thead>
          <tr className="border-b">
            <th scope="col" className="py-3 pr-4 font-semibold">
              Participant
            </th>
            <th scope="col" className="py-3 pr-4 font-semibold">
              Location
            </th>
            <th scope="col" className="py-3 pr-4 font-semibold">
              Consent
            </th>
            <th scope="col" className="py-3 font-semibold">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.participantId} className="border-b">
              <td className="py-4 pr-4">{row.displayName}</td>
              <td className="py-4 pr-4">{row.homeSuburb ?? "—"}</td>
              <td className="py-4 pr-4">
                <MapAbleStatusBadge
                  status={row.consentActive ? "consent_active" : "consent_required"}
                />
              </td>
              <td className="py-4">
                <Link
                  href={`/support-coordinator/participants/${row.participantId}`}
                  className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 py-2 text-primary-foreground underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  View overview
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
