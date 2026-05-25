import { QuoteRequestInbox } from "@/components/admin-panels/provider/QuoteRequestInbox";
import { requireProviderPanel } from "@/lib/auth/panel-guards";
import { listProviderQuoteInbox } from "@/lib/providers/quote-service";
import { resolveProviderOrganisationId } from "@/lib/providers/provider-service";

export const metadata = { title: "Quotes | Provider admin" };

export default async function ProviderQuotesPage() {
  const user = await requireProviderPanel();
  const orgId = await resolveProviderOrganisationId(user);
  const quotes = await listProviderQuoteInbox(user, orgId);
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Quote requests</h1>
      <QuoteRequestInbox quotes={quotes} />
    </div>
  );
}
