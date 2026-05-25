"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";

import { cn } from "@/app/lib/utils";
import { OnboardingStepper } from "@/components/provider-onboarding/OnboardingStepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mapableSearchInputClass, mapableSectionCardClass } from "@/lib/brand/styles";
import {
  nextStepId,
  previousStepId,
} from "@/lib/provider-onboarding/provider-onboarding-service";
import type { OrganisationType } from "@prisma/client";

import type {
  ProviderOnboardingPatchBody,
  ProviderOnboardingState,
  ProviderOnboardingStepId,
} from "@/types/provider-onboarding";

const ORG_TYPES: { value: OrganisationType; label: string }[] = [
  { value: "care_provider", label: "Care provider" },
  { value: "transport_provider", label: "Transport provider" },
  { value: "support_coordination", label: "Support coordination" },
  { value: "community_partner", label: "Community partner" },
];

const inputClass = mapableSearchInputClass;

type ProviderOnboardingWizardProps = {
  initialState: ProviderOnboardingState;
};

export function ProviderOnboardingWizard({
  initialState,
}: ProviderOnboardingWizardProps) {
  const [state, setState] = useState(initialState);
  const [step, setStep] = useState<ProviderOnboardingStepId>(
    initialState.currentStep,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const org = state.organisation;

  const refresh = useCallback(async () => {
    const res = await fetch("/api/provider/onboarding");
    if (!res.ok) throw new Error("Could not load onboarding state");
    const data = (await res.json()) as ProviderOnboardingState;
    setState(data);
    setStep(data.currentStep);
    return data;
  }, []);

  async function saveStep(body: ProviderOnboardingPatchBody) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/provider/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save this step");
      return null;
    }
    setState(data);
    return data as ProviderOnboardingState;
  }

  async function handleSubmitApplication() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/provider/onboarding/submit", {
      method: "POST",
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not submit application");
      return;
    }
    setState(data);
    setStep("review");
    setMessage(
      "Your application has been submitted. MapAble will review your details and notify you when your organisation is verified.",
    );
  }

  async function goNext(patch: ProviderOnboardingPatchBody) {
    const updated = await saveStep(patch);
    if (!updated) return;
    const next = nextStepId(patch.step);
    if (next) setStep(next);
  }

  function goBack() {
    const prev = previousStepId(step);
    if (prev) setStep(prev);
  }

  if (state.submitted) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Application under review
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            {message ??
              "Thank you for submitting your provider application. Our team will verify your organisation details before you can receive bookings through MapAble."}
          </p>
        </header>
        <Card className={mapableSectionCardClass}>
          <CardHeader>
            <CardTitle>{org.name}</CardTitle>
            <CardDescription>
              Status: {org.verificationStatus.replace(/_/g, " ")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              {state.tasks.map((t) => (
                <li key={t.id} className="flex justify-between gap-4">
                  <span>{t.title}</span>
                  <span className="text-muted-foreground">{t.status}</span>
                </li>
              ))}
            </ul>
            {state.canAccessConsole ? (
              <Button asChild variant="default" size="lg">
                <Link href="/provider/bookings">Open provider console</Link>
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => void refresh()}
                disabled={busy}
              >
                Refresh status
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Provider onboarding
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Set up your organisation profile for MapAble verification. Participants
          only see verified providers in search once your application is approved.
        </p>
      </header>

      <OnboardingStepper
        currentStep={step}
        completedSteps={state.completedSteps}
      />

      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {step === "organisation" && (
        <Card className={mapableSectionCardClass}>
          <CardHeader>
            <CardTitle className="font-heading text-xl">Organisation profile</CardTitle>
            <CardDescription>
              Legal name, ABN and contact details for your organisation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                void goNext({
                  step: "organisation",
                  data: {
                    name: String(fd.get("name") ?? ""),
                    abn: String(fd.get("abn") ?? "") || undefined,
                    organisationType: String(
                      fd.get("organisationType"),
                    ) as OrganisationType,
                    contactEmail: String(fd.get("contactEmail") ?? "") || undefined,
                    contactPhone: String(fd.get("contactPhone") ?? "") || undefined,
                    website: String(fd.get("website") ?? "") || undefined,
                    address: String(fd.get("address") ?? "") || undefined,
                  },
                });
              }}
            >
              <label className="block space-y-1 text-sm font-medium">
                Organisation name
                <input
                  name="name"
                  required
                  defaultValue={org.name}
                  className={inputClass}
                  autoComplete="organization"
                />
              </label>
              <label className="block space-y-1 text-sm font-medium">
                ABN
                <input
                  name="abn"
                  defaultValue={org.abn ?? ""}
                  className={inputClass}
                  inputMode="numeric"
                  pattern="[0-9]{11}"
                  title="11 digit Australian Business Number"
                />
              </label>
              <label className="block space-y-1 text-sm font-medium">
                Organisation type
                <select
                  name="organisationType"
                  required
                  defaultValue={org.organisationType}
                  className={inputClass}
                >
                  {ORG_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1 text-sm font-medium">
                  Contact email
                  <input
                    name="contactEmail"
                    type="email"
                    defaultValue={org.contactEmail ?? ""}
                    className={inputClass}
                  />
                </label>
                <label className="block space-y-1 text-sm font-medium">
                  Contact phone
                  <input
                    name="contactPhone"
                    type="tel"
                    defaultValue={org.contactPhone ?? ""}
                    className={inputClass}
                  />
                </label>
              </div>
              <label className="block space-y-1 text-sm font-medium">
                Website
                <input
                  name="website"
                  type="url"
                  defaultValue={org.website ?? ""}
                  className={inputClass}
                />
              </label>
              <label className="block space-y-1 text-sm font-medium">
                Business address
                <input
                  name="address"
                  defaultValue={org.address ?? ""}
                  className={inputClass}
                />
              </label>
              <WizardActions busy={busy} showBack={false} />
            </form>
          </CardContent>
        </Card>
      )}

      {step === "regions" && (
        <Card className={mapableSectionCardClass}>
          <CardHeader>
            <CardTitle className="font-heading text-xl">Service regions</CardTitle>
            <CardDescription>
              Where your organisation delivers supports (comma-separated).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const raw = String(fd.get("serviceRegions") ?? "");
                void goNext({
                  step: "regions",
                  data: {
                    serviceRegions: raw
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                    notes: String(fd.get("notes") ?? "") || undefined,
                  },
                });
              }}
            >
              <label className="block space-y-1 text-sm font-medium">
                Service regions
                <input
                  name="serviceRegions"
                  required
                  defaultValue={org.serviceRegions.join(", ")}
                  placeholder="e.g. Melbourne Metro, Geelong, Ballarat"
                  className={inputClass}
                />
              </label>
              <label className="block space-y-1 text-sm font-medium">
                About your services
                <textarea
                  name="notes"
                  defaultValue={org.notes ?? ""}
                  className={cn(inputClass, "min-h-[120px]")}
                />
              </label>
              <WizardActions busy={busy} onBack={goBack} />
            </form>
          </CardContent>
        </Card>
      )}

      {step === "ndis" && (
        <Card className={mapableSectionCardClass}>
          <CardHeader>
            <CardTitle className="font-heading text-xl">NDIS registration</CardTitle>
            <CardDescription>
              Claim NDIS registration status. MapAble verifies claims manually.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                void goNext({
                  step: "ndis",
                  data: {
                    ndisRegistrationClaimed: fd.get("ndisClaimed") === "on",
                    ndisRegistrationNumber:
                      String(fd.get("ndisNumber") ?? "") || undefined,
                  },
                });
              }}
            >
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  name="ndisClaimed"
                  defaultChecked={org.ndisRegistrationClaimed}
                  className="mt-1 size-5 rounded border-input"
                />
                <span>
                  Our organisation is registered with the NDIS Quality and
                  Safeguards Commission.
                </span>
              </label>
              <label className="block space-y-1 text-sm font-medium">
                NDIS registration number (if applicable)
                <input
                  name="ndisNumber"
                  defaultValue={org.ndisRegistrationNumber ?? ""}
                  className={inputClass}
                />
              </label>
              <WizardActions busy={busy} onBack={goBack} />
            </form>
          </CardContent>
        </Card>
      )}

      {step === "insurance" && (
        <Card className={mapableSectionCardClass}>
          <CardHeader>
            <CardTitle className="font-heading text-xl">Insurance</CardTitle>
            <CardDescription>
              Confirm you hold appropriate insurance. Document upload is handled in
              a later phase; record status here for review.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                void goNext({
                  step: "insurance",
                  data: {
                    insuranceStatus: String(fd.get("insuranceStatus") ?? ""),
                    insuranceNotes:
                      String(fd.get("insuranceNotes") ?? "") || undefined,
                  },
                });
              }}
            >
              <label className="block space-y-1 text-sm font-medium">
                Insurance status
                <select
                  name="insuranceStatus"
                  required
                  defaultValue={org.insuranceStatus ?? ""}
                  className={inputClass}
                >
                  <option value="">Select…</option>
                  <option value="held_current">Current policy held</option>
                  <option value="renewal_pending">Renewal in progress</option>
                  <option value="will_provide">Will provide before go-live</option>
                </select>
              </label>
              <label className="block space-y-1 text-sm font-medium">
                Notes for reviewers
                <textarea
                  name="insuranceNotes"
                  className={cn(inputClass, "min-h-[100px]")}
                  placeholder="Policy type, expiry, or how you will supply documents"
                />
              </label>
              <WizardActions busy={busy} onBack={goBack} />
            </form>
          </CardContent>
        </Card>
      )}

      {step === "review" && (
        <Card className={mapableSectionCardClass}>
          <CardHeader>
            <CardTitle className="font-heading text-xl">Review and submit</CardTitle>
            <CardDescription>
              Check your details before sending your application to MapAble.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <ReviewItem label="Organisation" value={org.name} />
              <ReviewItem label="ABN" value={org.abn ?? "—"} />
              <ReviewItem label="Type" value={org.organisationType.replace(/_/g, " ")} />
              <ReviewItem label="Email" value={org.contactEmail ?? "—"} />
              <ReviewItem label="Regions" value={org.serviceRegions.join(", ") || "—"} />
              <ReviewItem
                label="NDIS registered"
                value={org.ndisRegistrationClaimed ? "Yes" : "No"}
              />
              <ReviewItem label="Insurance" value={org.insuranceStatus ?? "—"} />
            </dl>
            <p className="text-sm text-muted-foreground">
              By submitting, you confirm these details are accurate. MapAble staff
              may contact you for supporting documents before listing your
              organisation in Provider Finder.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                size="default"
                onClick={goBack}
                disabled={busy}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="default"
                size="lg"
                disabled={busy}
                onClick={() => void handleSubmitApplication()}
              >
                Submit for review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-foreground">{value}</dd>
    </div>
  );
}

function WizardActions({
  busy,
  showBack = true,
  onBack,
}: {
  busy: boolean;
  showBack?: boolean;
  onBack?: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 pt-2">
      {showBack && onBack && (
        <Button
          type="button"
          variant="secondary"
          size="default"
          onClick={onBack}
          disabled={busy}
        >
          Back
        </Button>
      )}
      <Button type="submit" variant="default" size="lg" disabled={busy}>
        Save and continue
      </Button>
    </div>
  );
}
