import Link from "next/link";

import { FieldModeShell } from "@/components/field/FieldModeShell";
import { SafetyCheckCard } from "@/components/field/SafetyCheckCard";
import { requireAuth } from "@/lib/auth/guards";

export const metadata = { title: "Safety check | MapAble Driver" };

export default async function TripSafetyCheckPage({
  params,
}: {
  params: Promise<{ transportBookingId: string }>;
}) {
  await requireAuth();
  const { transportBookingId } = await params;

  return (
    <FieldModeShell title="Trip safety check">
      <SafetyCheckCard />
      <Link
        href={`/driver/trips/${transportBookingId}`}
        className="inline-flex min-h-11 items-center text-primary underline"
      >
        Back to trip
      </Link>
    </FieldModeShell>
  );
}
