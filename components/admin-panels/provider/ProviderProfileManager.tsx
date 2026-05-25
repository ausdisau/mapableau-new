import { PanelSection } from "@/components/admin-panels/PanelSection";
import type { Organisation, ProviderService, AccessCapability } from "@prisma/client";

type Org = Organisation & {
  providerServices: ProviderService[];
  accessCapabilities: AccessCapability[];
};

export function ProviderProfileManager({ org }: { org: Org | null }) {
  if (!org) return <p>Organisation not found.</p>;

  return (
    <div className="space-y-6">
      <PanelSection title="Organisation profile">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">ABN</dt>
            <dd>{org.abn ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Verification</dt>
            <dd>{org.verificationStatus}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Booking eligible</dt>
            <dd>{org.bookingEligible ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Regions</dt>
            <dd>{org.serviceRegions.join(", ") || "—"}</dd>
          </div>
        </dl>
      </PanelSection>
      <PanelSection title="Services">
        <ul className="space-y-2 text-sm">
          {org.providerServices.map((s) => (
            <li key={s.id}>{s.name}</li>
          ))}
        </ul>
      </PanelSection>
      <PanelSection title="Access capabilities">
        <ul className="space-y-2 text-sm">
          {org.accessCapabilities.map((c) => (
            <li key={c.id}>
              {c.capabilityKey} {c.verified ? "✓" : "(pending)"}
            </li>
          ))}
        </ul>
      </PanelSection>
    </div>
  );
}
