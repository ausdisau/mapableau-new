"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { TransportVerificationEditor } from "@/components/transport/TransportVerificationEditor";
import { TransportVehicleFeaturesEditor } from "@/components/transport/TransportVehicleFeaturesEditor";

type VehicleDetail = {
  id: string;
  displayName: string;
  registrationNumber: string | null;
  requiredVerificationKinds: string[];
  verifications: Array<{
    kind: string;
    status: string;
    expiresAt: string | null;
    notes: string | null;
  }>;
  features: {
    wheelchairAccessible: boolean;
    rampAvailable: boolean;
    liftAvailable: boolean;
    hoistAvailable: boolean;
    assistanceAnimalFriendly: boolean;
  } | null;
  eligibility?: { eligible: boolean; reasons: string[] };
};

export function TransportVehicleFleetDetail({
  organisationId,
  vehicle,
}: {
  organisationId: string;
  vehicle: VehicleDetail;
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
        <h1 className="font-heading text-2xl font-bold">{vehicle.displayName}</h1>
        {vehicle.registrationNumber ? (
          <p className="text-sm text-muted-foreground">{vehicle.registrationNumber}</p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          {vehicle.eligibility?.eligible
            ? "Eligible for dispatch"
            : vehicle.eligibility?.reasons.join(". ") ?? "Not eligible"}
        </p>
      </header>
      <TransportVerificationEditor
        organisationId={organisationId}
        resourceType="vehicles"
        resourceId={vehicle.id}
        requiredKinds={vehicle.requiredVerificationKinds}
        verifications={vehicle.verifications}
        onSaved={() => router.refresh()}
      />
      <TransportVehicleFeaturesEditor
        organisationId={organisationId}
        vehicleId={vehicle.id}
        features={vehicle.features}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
