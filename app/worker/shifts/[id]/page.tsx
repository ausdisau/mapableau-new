import Link from "next/link";

import { BigActionButton } from "@/components/field/BigActionButton";
import { FieldModeShell } from "@/components/field/FieldModeShell";
import { ShiftStatusStepper } from "@/components/field/ShiftStatusStepper";
import { requireAuth } from "@/lib/auth/guards";

export const metadata = { title: "Shift | MapAble Worker" };

export default async function WorkerShiftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  return (
    <FieldModeShell title={`Shift ${id.slice(0, 8)}`}>
      <ShiftStatusStepper current="scheduled" />
      <BigActionButton href={`/worker/shifts/${id}/service-log`} label="Service log" variant="primary" />
      <BigActionButton href="/dashboard/messages" label="Message team" variant="secondary" />
      <Link
        href="/dashboard/incidents/new"
        className="block min-h-11 text-center text-sm font-medium text-destructive underline"
      >
        Report incident
      </Link>
    </FieldModeShell>
  );
}
