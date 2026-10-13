import Link from "next/link";

import { AccessPassSummary } from "@/components/digital-twin/AccessPassSummary";
import { ConsentGrantSummary } from "@/components/digital-twin/ConsentGrantSummary";
import { DemoDataBanner } from "@/components/digital-twin/DemoDataBanner";
import { DigitalTwinDisclaimerPanel } from "@/components/digital-twin/DigitalTwinDisclaimerPanel";
import {
  getDemoAccessProfiles,
  getDemoConsentGrants,
} from "@/lib/digital-twin/access-pass";

export const metadata = {
  title: "Access Pass Demo | MapAble",
  description: "Demo access profiles and consent UI for MapAble Digital Twin.",
};

export default function AccessPassDemoPage() {
  const profiles = getDemoAccessProfiles();
  const grants = getDemoConsentGrants();

  return (
    <main id="main-content" className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <DemoDataBanner />

      <header className="mt-8">
        <p className="text-sm font-medium uppercase tracking-wide text-[#005B7F]">Access Pass</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Access Pass demo</h1>
        <p className="mt-4 text-muted-foreground">
          Preview how user-controlled access profiles and consent grants could work with Digital
          Twin compatibility checks. No real sensitive data is stored in this demo.
        </p>
      </header>

      <section aria-labelledby="profiles-heading" className="mt-10 space-y-6">
        <h2 id="profiles-heading" className="text-xl font-semibold">
          Demo access profiles
        </h2>
        {profiles.map((profile) => (
          <AccessPassSummary key={profile.id} profile={profile} />
        ))}
      </section>

      <section aria-labelledby="consent-heading" className="mt-10 space-y-6">
        <h2 id="consent-heading" className="text-xl font-semibold">
          Demo consent grants
        </h2>
        {grants.map((grant) => (
          <ConsentGrantSummary key={grant.id} grant={grant} />
        ))}
      </section>

      <div className="mt-10">
        <DigitalTwinDisclaimerPanel />
      </div>

      <p className="mt-6 text-sm">
        <Link href="/digital-twin" className="font-semibold text-[#005B7F] hover:underline">
          Try compatibility check on a demo place
        </Link>
      </p>
    </main>
  );
}
