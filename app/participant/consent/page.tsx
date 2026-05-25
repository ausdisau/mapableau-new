import { ConsentCentreSummary } from "@/components/admin-panels/participant/ConsentCentreSummary";
import { requireParticipantPanel } from "@/lib/auth/panel-guards";
import { getConsentCentreSummary } from "@/lib/consent/consent-panel-service";

export const metadata = { title: "Consent | Participant admin" };

export default async function ParticipantConsentPage() {
  const user = await requireParticipantPanel();
  const summary = await getConsentCentreSummary(user);
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Consent</h1>
      <ConsentCentreSummary {...summary} />
    </div>
  );
}
