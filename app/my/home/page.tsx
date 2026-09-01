import Link from "next/link";
import { redirect } from "next/navigation";

import { AlexaAccountLinkCard } from "@/components/home/AlexaAccountLinkCard";
import { mapableHomeFlags } from "@/lib/config/mapable-home";
import { requirePersonalAgencyGate } from "@/lib/personal-agency/gates";
import {
  getAlexaAccountLinkingPublicStatus,
  isAlexaAccountLinkingConfigured,
} from "@/lib/home/adapters/alexa/account-linking-config";
import { getAlexaLinkStatusForUser } from "@/lib/home/adapters/alexa/account-link-service";
import {
  getHomeEnvironmentSnapshot,
  listSimulatorRoutines,
} from "@/lib/home/service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My MapAble Home",
};

export default async function MyHomePage() {
  const user = await requirePersonalAgencyGate();

  if (!mapableHomeFlags.enabled || !mapableHomeFlags.simulatorEnabled) {
    redirect("/my");
  }

  const snapshot = await getHomeEnvironmentSnapshot();
  const routines = listSimulatorRoutines();
  const alexaLink = await getAlexaLinkStatusForUser(user.id);
  const alexaConfigured = isAlexaAccountLinkingConfigured();
  // Touch public status helper so operators never see secrets in UI paths.
  void getAlexaAccountLinkingPublicStatus();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#005B7F]">
          Simulation · Proposed / in development
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
          My home
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          A participant-facing view of your simulated home capabilities,
          routines, permissions and activity. No physical devices are connected.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          className="rounded-2xl border border-slate-200 bg-white p-5"
          aria-labelledby="home-status-heading"
        >
          <h2 id="home-status-heading" className="text-xl font-black">
            Home status
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {snapshot.environment.displayName} ·{" "}
            {snapshot.environment.claimState}
          </p>
          <ul className="mt-4 space-y-2">
            {snapshot.environment.zones.map((zone) => (
              <li key={zone.id} className="text-sm text-slate-700">
                <span className="font-semibold">{zone.displayName}</span>
                <span className="text-slate-500"> · {zone.privacyZone}</span>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="rounded-2xl border border-slate-200 bg-white p-5"
          aria-labelledby="home-capabilities-heading"
        >
          <h2 id="home-capabilities-heading" className="text-xl font-black">
            Capabilities
          </h2>
          <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {snapshot.endpoints.map((endpoint) => (
              <li key={endpoint.id} className="text-sm text-slate-700">
                <span className="font-semibold">{endpoint.displayName}</span>
                <span className="text-slate-500">
                  {" "}
                  · {endpoint.category} · confidence {endpoint.stateConfidence}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="rounded-2xl border border-slate-200 bg-white p-5"
          aria-labelledby="home-routines-heading"
        >
          <h2 id="home-routines-heading" className="text-xl font-black">
            Routines
          </h2>
          <ul className="mt-4 space-y-3">
            {routines.map((routine) => (
              <li key={routine.id}>
                <p className="font-semibold text-slate-800">
                  {routine.displayName}
                </p>
                <p className="text-sm text-slate-600">{routine.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="rounded-2xl border border-slate-200 bg-white p-5"
          aria-labelledby="home-permissions-heading"
        >
          <h2 id="home-permissions-heading" className="text-xl font-black">
            People & permissions
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Purpose-bound temporary delegation is modelled in the authority
            contracts. Real remote access is not enabled in P0.
          </p>
          <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            Example (simulation): a support worker may control kitchen lights
            and blinds during a timed visit, but not unlock the front door or
            access cameras.
          </p>
        </section>

        <section
          className="rounded-2xl border border-slate-200 bg-white p-5"
          aria-labelledby="home-activity-heading"
        >
          <h2 id="home-activity-heading" className="text-xl font-black">
            Activity
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Action receipts appear here after simulated proposes/confirmations
            through the Home APIs.
          </p>
        </section>

        <AlexaAccountLinkCard
          link={alexaLink}
          configured={alexaConfigured}
          linkingEnabled={mapableHomeFlags.alexaAccountLinkingEnabled}
        />

        <section
          className="rounded-2xl border border-slate-200 bg-white p-5"
          aria-labelledby="home-privacy-heading"
        >
          <h2 id="home-privacy-heading" className="text-xl font-black">
            Privacy & control
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Vendor permission alone is never enough. MapAble participant
            authority, confirmation and refusal always apply. Safety-critical
            actions remain NOT_SUPPORTED.
          </p>
          <Link
            href="/my/control"
            className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-[#005B7F] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
          >
            Open privacy & control
          </Link>
        </section>
      </div>
    </div>
  );
}
