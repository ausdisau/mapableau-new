import { FieldModeShell } from "@/components/field/FieldModeShell";
import { ServiceLogMobileForm } from "@/components/field/ServiceLogMobileForm";
import { requireAuth } from "@/lib/auth/guards";

export const metadata = { title: "Service log | MapAble Worker" };

export default async function WorkerServiceLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  return (
    <FieldModeShell title="Service log">
      <ServiceLogMobileForm shiftId={id} />
    </FieldModeShell>
  );
}
