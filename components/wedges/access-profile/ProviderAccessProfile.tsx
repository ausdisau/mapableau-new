"use client";

import type { ProviderAccessCapability } from "@/types/wedges";
import { VERIFICATION_DISCLAIMER } from "@/types/wedges";
import { AccessEvidenceList } from "./AccessEvidenceList";

type ProviderAccessProfileProps = {
  capability: ProviderAccessCapability;
  providerName?: string;
};

function formatVerificationSource(source: ProviderAccessCapability["verificationSource"]): string {
  switch (source) {
    case "provider-declared":
      return "Provider-declared";
    case "community-checked":
      return "Community-checked";
    case "mapable-assessed":
      return "MapAble-assessed";
    case "unknown":
      return "Not yet verified";
    default: {
      const _exhaustive: never = source;
      return _exhaustive;
    }
  }
}

function boolLabel(value: boolean | null, yes = "Yes", no = "No", unknown = "Not confirmed"): string {
  if (value === true) return yes;
  if (value === false) return no;
  return unknown;
}

export function ProviderAccessProfile({
  capability,
  providerName,
}: ProviderAccessProfileProps) {
  return (
    <section aria-labelledby="access-profile-heading" className="space-y-4">
      <div>
        <h2 id="access-profile-heading" className="font-heading text-xl font-semibold">
          Access readiness profile
          {providerName ? ` — ${providerName}` : ""}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Source: {formatVerificationSource(capability.verificationSource)}
          {capability.lastVerifiedAt
            ? ` · Last updated ${new Date(capability.lastVerifiedAt).toLocaleDateString("en-AU")}`
            : null}
        </p>
      </div>

      <AccessEvidenceList capability={capability} />

      <div className="rounded-lg border border-border p-4">
        <h3 className="font-medium">Physical access</h3>
        <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Step-free entry</dt>
            <dd>{boolLabel(capability.stepFreeEntry)}</dd>
          </div>
          {capability.doorWidthMm != null ? (
            <div>
              <dt className="text-muted-foreground">Door width</dt>
              <dd>{capability.doorWidthMm} mm</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-muted-foreground">Accessible toilet</dt>
            <dd>{boolLabel(capability.accessibleToilet)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Accessible parking</dt>
            <dd>{boolLabel(capability.accessibleParking)}</dd>
          </div>
          {capability.dropOffPoint ? (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Drop-off point</dt>
              <dd>{capability.dropOffPoint}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="rounded-lg border border-border p-4">
        <h3 className="font-medium">Communication and service options</h3>
        <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Low sensory option</dt>
            <dd>{boolLabel(capability.lowSensoryOption)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Auslan available</dt>
            <dd>{boolLabel(capability.auslanAvailable)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">AAC friendly</dt>
            <dd>{boolLabel(capability.aacFriendly)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Plain language materials</dt>
            <dd>{boolLabel(capability.plainLanguageMaterials)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Telehealth</dt>
            <dd>{boolLabel(capability.telehealthAvailable)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Home visits</dt>
            <dd>{boolLabel(capability.homeVisitsAvailable)}</dd>
          </div>
          {capability.assistanceAnimalPolicy ? (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Assistance animals</dt>
              <dd>{capability.assistanceAnimalPolicy}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      <section aria-labelledby="confirm-before-heading" className="rounded-lg bg-muted/40 p-4">
        <h3 id="confirm-before-heading" className="font-medium">
          What to confirm before attending
        </h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Your specific access needs still match what the provider can offer.</li>
          <li>Entry routes, parking, and toilet access on the day of your visit.</li>
          <li>Communication supports you need (Auslan, AAC, plain language).</li>
          <li>Any equipment or assistance animal requirements.</li>
        </ul>
      </section>

      <p className="text-xs text-muted-foreground" role="note">
        {VERIFICATION_DISCLAIMER} Provider-declared information should be confirmed before
        attending.
      </p>

      <button
        type="button"
        className="text-sm text-primary underline"
        onClick={() => {
          /* TODO: report outdated access info workflow */
        }}
      >
        Report outdated access information
      </button>
    </section>
  );
}
