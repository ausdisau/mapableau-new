"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { TransportVerificationEditor } from "@/components/transport/TransportVerificationEditor";

type DriverDetail = {
  id: string;
  displayName: string;
  active: boolean;
  requiredVerificationKinds: string[];
  verifications: Array<{
    kind: string;
    status: string;
    expiresAt: string | null;
    notes: string | null;
  }>;
  eligibility?: { eligible: boolean; reasons: string[] };
};

export function TransportDriverFleetDetail({
  organisationId,
  driver,
}: {
  organisationId: string;
  driver: DriverDetail;
}) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <p>
        <Link href="/provider/transport/fleet" className="text-sm text-primary hover:underline">
          ← Fleet
        </Link>
      </p>
      <header>
        <h1 className="font-heading text-2xl font-bold">{driver.displayName}</h1>
        <p className="text-sm text-muted-foreground">
          {driver.eligibility?.eligible
            ? "Eligible for dispatch"
            : driver.eligibility?.reasons.join(". ") ?? "Not eligible"}
        </p>
      </header>
      <TransportVerificationEditor
        organisationId={organisationId}
        resourceType="drivers"
        resourceId={driver.id}
        requiredKinds={driver.requiredVerificationKinds}
        verifications={driver.verifications}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
