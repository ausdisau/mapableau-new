"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";

import { AuthAlert } from "@/components/auth/AuthAlert";
import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import {
  DOMAIN_SERVICES_MODULE_KEYS,
  defaultBrandDraft,
  defaultModuleFlags,
  type DomainServicesBrandDraft,
  type DomainServicesModuleKey,
} from "@/lib/tenancy/domain-services-brand";
import {
  WIZARD_STEPS,
  canAdvanceFrom,
  nextStep,
  previousStep,
  proposedHostname,
  type WizardStep,
} from "@/lib/tenancy/domain-services-wizard-model";

const MODULE_LABELS: Record<DomainServicesModuleKey, string> = {
  landing: "Landing page",
  services: "Services directory",
  enquire: "Enquire form",
  portal: "Participant portal link",
  contact: "Contact page",
  privacy: "Privacy notice",
  admin: "Admin / domain readiness",
};

const STEP_TITLES: Record<WizardStep, string> = {
  account: "Account & proposed hostname",
  modules: "Module catalogue",
  branding: "Brand & support contacts",
};

export function DomainServicesSetupWizard({
  hostSuffix = "mapable.com.au",
}: {
  hostSuffix?: string;
}) {
  const { data: session, status } = useSession();
  const [step, setStep] = useState<WizardStep>("account");
  const [slug, setSlug] = useState("");
  const [brand, setBrand] = useState<DomainServicesBrandDraft>(defaultBrandDraft());
  const [modules, setModules] = useState(defaultModuleFlags());
  const [error, setError] = useState<string | null>(null);
  const [slugHint, setSlugHint] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewPath, setPreviewPath] = useState<string | null>(null);

  const hostname = useMemo(
    () => (slug ? proposedHostname(slug, hostSuffix) : `your-slug.${hostSuffix}`),
    [slug, hostSuffix],
  );

  const stepIndex = WIZARD_STEPS.indexOf(step);

  async function checkSlug() {
    setSlugHint(null);
    setError(null);
    try {
      const res = await fetch("/api/domain-services/slug-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = (await res.json()) as {
        available?: boolean;
        reason?: string | null;
        error?: string;
        proposedHostname?: string;
      };
      if (!res.ok) {
        setSlugHint(data.error ?? "Could not check slug");
        return;
      }
      setSlugHint(
        data.available
          ? `Available · proposed ${data.proposedHostname ?? hostname}`
          : `Unavailable (${data.reason ?? "taken"})`,
      );
    } catch {
      setSlugHint("Could not check slug");
    }
  }

  function goNext() {
    setError(null);
    const validation = canAdvanceFrom(step, { slug, brand, modules });
    if (validation) {
      setError(validation);
      return;
    }
    const nxt = nextStep(step);
    if (nxt) setStep(nxt);
  }

  function goBack() {
    setError(null);
    const prev = previousStep(step);
    if (prev) setStep(prev);
  }

  async function submit() {
    setError(null);
    const validation = canAdvanceFrom("branding", { slug, brand, modules });
    if (validation) {
      setError(validation);
      return;
    }
    if (!session?.user) {
      setError("Sign in required to create your draft hosting site.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/domain-services/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, brand, modules }),
      });
      const data = (await res.json()) as {
        error?: string;
        previewPath?: string;
        draft?: { domainActivation?: string };
      };
      if (!res.ok) {
        setError(data.error ?? "Setup failed");
        return;
      }
      setPreviewPath(data.previewPath ?? `/t/${slug}`);
    } catch {
      setError("Setup failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return <p className="text-sm text-muted-foreground">Loading session…</p>;
  }

  if (previewPath) {
    return (
      <div className="space-y-4 rounded-xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold">Draft tenant ready</h2>
        <p className="text-sm text-muted-foreground">
          Your white-label draft is in preview status. Domain activation remains{" "}
          <strong>NOT CONFIGURED</strong> — no live DNS or Vercel attach.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={previewPath}>Open preview</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/for-providers">Back to for providers</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap gap-2" aria-label="Setup progress">
        {WIZARD_STEPS.map((s, i) => (
          <li
            key={s}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              i === stepIndex
                ? "bg-primary text-primary-foreground"
                : i < stepIndex
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1}. {STEP_TITLES[s]}
          </li>
        ))}
      </ol>

      {!session?.user ? (
        <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <AuthAlert variant="info">
            Sign in to continue. On submit we create your provider organisation
            and draft tenant under Domain Services.
          </AuthAlert>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link
                href={`/login?callbackUrl=${encodeURIComponent("/provider/domain-services/setup")}`}
              >
                Sign in
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link
                href={`/register?callbackUrl=${encodeURIComponent("/provider/domain-services/setup")}`}
              >
                Create account
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      {step === "account" ? (
        <section className="space-y-4 rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">{STEP_TITLES.account}</h2>
          <p className="text-sm text-muted-foreground">
            Choose a slug for branding. Proposed host{" "}
            <span className="font-mono">{hostname}</span> is not live DNS.
          </p>
          <AccessibleFormField
            id="ds-slug"
            label="Proposed slug"
            required
            hint="Lowercase letters, numbers, and hyphens. Reserved platform labels are blocked."
            error={undefined}
          >
            <input
              id="ds-slug"
              className={formInputClass}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </AccessibleFormField>
          <AccessibleFormField
            id="ds-company"
            label="Organisation name"
            required
            error={undefined}
          >
            <input
              id="ds-company"
              className={formInputClass}
              value={brand.companyName}
              onChange={(e) =>
                setBrand((b) => ({ ...b, companyName: e.target.value }))
              }
            />
          </AccessibleFormField>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void checkSlug()}>
              Check availability
            </Button>
            {slugHint ? (
              <p className="self-center text-sm text-muted-foreground">{slugHint}</p>
            ) : null}
          </div>
        </section>
      ) : null}

      {step === "modules" ? (
        <section className="space-y-4 rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">{STEP_TITLES.modules}</h2>
          <p className="text-sm text-muted-foreground">
            Toggle which preview modules appear on your draft site. This is not
            domain commerce.
          </p>
          <ul className="space-y-3">
            {DOMAIN_SERVICES_MODULE_KEYS.map((key) => (
              <li key={key} className="flex items-start gap-3 text-sm">
                <input
                  id={`ds-module-${key}`}
                  type="checkbox"
                  className="mt-1"
                  checked={modules[key]}
                  onChange={(e) =>
                    setModules((m) => ({ ...m, [key]: e.target.checked }))
                  }
                />
                <label htmlFor={`ds-module-${key}`} className="font-medium">
                  {MODULE_LABELS[key]}
                </label>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {step === "branding" ? (
        <section className="space-y-4 rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">{STEP_TITLES.branding}</h2>
          <AccessibleFormField id="ds-tagline" label="Tagline" error={undefined}>
            <input
              id="ds-tagline"
              className={formInputClass}
              value={brand.tagline}
              onChange={(e) =>
                setBrand((b) => ({ ...b, tagline: e.target.value }))
              }
            />
          </AccessibleFormField>
          <AccessibleFormField
            id="ds-primary"
            label="Primary colour"
            hint="CSS colour used in the draft preview shell."
            error={undefined}
          >
            <input
              id="ds-primary"
              className={formInputClass}
              value={brand.primaryColor}
              onChange={(e) =>
                setBrand((b) => ({ ...b, primaryColor: e.target.value }))
              }
            />
          </AccessibleFormField>
          <AccessibleFormField
            id="ds-email"
            label="Support email"
            error={undefined}
          >
            <input
              id="ds-email"
              type="email"
              className={formInputClass}
              value={brand.supportEmail}
              onChange={(e) =>
                setBrand((b) => ({ ...b, supportEmail: e.target.value }))
              }
            />
          </AccessibleFormField>
          <AccessibleFormField
            id="ds-phone"
            label="Support phone"
            error={undefined}
          >
            <input
              id="ds-phone"
              className={formInputClass}
              value={brand.supportPhone}
              onChange={(e) =>
                setBrand((b) => ({ ...b, supportPhone: e.target.value }))
              }
            />
          </AccessibleFormField>
          <div
            className="rounded-lg border border-dashed border-border p-4"
            aria-label="Theme preview"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Theme preview
            </p>
            <p
              className="mt-2 text-2xl font-bold"
              style={{ color: brand.primaryColor || undefined }}
            >
              {brand.companyName || "Your brand"}
            </p>
            <p className="text-sm text-muted-foreground">
              {brand.tagline || "Tagline appears here"}
            </p>
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          disabled={!previousStep(step)}
        >
          Back
        </Button>
        {step !== "branding" ? (
          <Button type="button" onClick={goNext}>
            Next
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={submitting || !session?.user}
          >
            {submitting ? "Creating draft…" : "Create draft preview"}
          </Button>
        )}
      </div>
    </div>
  );
}
