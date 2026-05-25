import { ProviderMapSearch } from "@/components/admin-panels/participant/ProviderMapSearch";
import { ProviderShortlist } from "@/components/admin-panels/participant/ProviderShortlist";
import { requireParticipantPanel } from "@/lib/auth/panel-guards";
import { getProviderShortlist } from "@/lib/participants/participant-service";

export const metadata = { title: "Find support | Participant admin" };

export default async function ParticipantSupportPage() {
  const user = await requireParticipantPanel();
  const shortlist = await getProviderShortlist(user);
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Find support</h1>
      <ProviderMapSearch />
      <ProviderShortlist {...shortlist} />
    </div>
  );
}
