import { AccessSignalsShell } from "@/components/access-signals/AccessSignalsShell";
import { FieldNotesObserve } from "@/components/access-signals/FieldNotesObserve";
import { getCommunityChallenge } from "@/lib/access-signals/community-challenges";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Field Notes (synthetic demo) | MapAble Access Signals",
};

export default async function AccessSignalsFieldNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ route?: string; challenge?: string }>;
}) {
  const params = await searchParams;
  const challenge = getCommunityChallenge(params.challenge);
  const routeId = challenge ? challenge.routeId : params.route;
  return (
    <AccessSignalsShell activePath="/access-signals/field-notes">
      <FieldNotesObserve initialRouteId={routeId} initialChallenge={challenge ? { title: challenge.title, focus: challenge.focus, prompt: challenge.evidencePrompt } : undefined} />
    </AccessSignalsShell>
  );
}
