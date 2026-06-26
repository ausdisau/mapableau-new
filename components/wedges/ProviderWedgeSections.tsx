import { ProviderAccessProfile } from "@/components/wedges/access-profile/ProviderAccessProfile";
import { TransportAccessPanel } from "@/components/wedges/transport/TransportAccessPanel";
import { TrustBreakdown } from "@/components/wedges/trust/TrustBreakdown";
import { RequestProgressTimeline } from "@/components/wedges/request-tracker/RequestProgressTimeline";
import { wedgesConfig } from "@/lib/config/wedges";
import {
  DEMO_ACCESS_PROFILE,
  MOCK_REQUEST_PROGRESS,
  MOCK_TRANSPORT_ACCESS,
  MOCK_TRUST_SCORES,
} from "@/lib/wedges/mock-providers";
import { resolveWedgeProvider } from "@/lib/wedges/provider-registry/resolve";

type ProviderWedgeSectionsProps = {
  providerId: string;
  providerName: string;
};

export function ProviderWedgeSections({
  providerId,
  providerName,
}: ProviderWedgeSectionsProps) {
  if (!wedgesConfig.mvpEnabled) return null;

  const wedge = resolveWedgeProvider(providerId);
  const trust = MOCK_TRUST_SCORES[providerId] ?? (wedge ? MOCK_TRUST_SCORES[wedge.id] : undefined);
  const transport =
    MOCK_TRANSPORT_ACCESS[providerId] ??
    (wedge ? MOCK_TRANSPORT_ACCESS[wedge.id] : undefined);

  if (!wedge && !trust && !transport) {
    return (
      <section className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
        <p>
          Access readiness profile not yet available for this provider.{" "}
          <a href="/request-support" className="text-primary underline">
            Request support
          </a>{" "}
          to help us gather the right information.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-10">
      {wedge ? (
        <ProviderAccessProfile
          capability={wedge.accessCapability}
          providerName={providerName}
        />
      ) : null}
      {transport ? (
        <TransportAccessPanel
          transport={transport}
          participantNeeds={DEMO_ACCESS_PROFILE}
        />
      ) : null}
      {trust ? <TrustBreakdown trust={trust} /> : null}
      <RequestProgressTimeline progress={MOCK_REQUEST_PROGRESS[0]} />
    </div>
  );
}
