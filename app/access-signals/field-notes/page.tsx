import { AccessSignalsShell } from "@/components/access-signals/AccessSignalsShell";
import { FieldNotesObserve } from "@/components/access-signals/FieldNotesObserve";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Field Notes (synthetic demo) | MapAble Access Signals",
};

export default async function AccessSignalsFieldNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ route?: string }>;
}) {
  const params = await searchParams;
  return (
    <AccessSignalsShell activePath="/access-signals/field-notes">
      <FieldNotesObserve initialRouteId={params.route} />
    </AccessSignalsShell>
  );
}
