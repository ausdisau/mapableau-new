"use client";

import { useState } from "react";

import { AccessibleFormField } from "@/components/forms/AccessibleFormField";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  interestFormTypeLabels,
  type InterestFormType,
} from "@/lib/interest/interest-form-schema";
import { trackProductEvent } from "@/lib/analytics/product-analytics";

export type InterestFormProps = {
  formType: InterestFormType;
  heading?: string;
  intro?: string;
};

export function InterestForm({ formType, heading, intro }: InterestFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roleOrOrganisation, setRoleOrOrganisation] = useState("");
  const [location, setLocation] = useState("");
  const [accessNeedsOrInterest, setAccessNeedsOrInterest] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const title = heading ?? interestFormTypeLabels[formType];

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    trackProductEvent("early_access_started", { form_type: formType });

    try {
      const response = await fetch("/api/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType,
          name,
          email,
          phone,
          roleOrOrganisation,
          location,
          accessNeedsOrInterest,
          message,
          consent,
          company,
        }),
      });
      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not submit form");
        return;
      }
      setSuccess(data.message ?? "Thanks — we received your submission.");
      trackProductEvent(`${formType}_submitted`, { form_type: formType });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {intro ? <p className="mt-2 text-sm text-muted-foreground">{intro}</p> : null}
      </div>

      {error ? (
        <Alert variant="error" title="Could not submit" live="assertive">
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert variant="success" title="Received" live="polite">
          {success}
        </Alert>
      ) : null}

      <div className="hidden" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      <AccessibleFormField id="interest-name" label="Name" required>
        <input
          id="interest-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          className="w-full min-h-[var(--touch-target-min)] rounded-lg border border-input px-3"
        />
      </AccessibleFormField>

      <AccessibleFormField id="interest-email" label="Email" required>
        <input
          id="interest-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full min-h-[var(--touch-target-min)] rounded-lg border border-input px-3"
        />
      </AccessibleFormField>

      <AccessibleFormField id="interest-phone" label="Phone (optional)" hint="We will only call if you ask us to">
        <input
          id="interest-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          className="w-full min-h-[var(--touch-target-min)] rounded-lg border border-input px-3"
        />
      </AccessibleFormField>

      <AccessibleFormField id="interest-role" label="Role or organisation type" required>
        <input
          id="interest-role"
          value={roleOrOrganisation}
          onChange={(e) => setRoleOrOrganisation(e.target.value)}
          required
          className="w-full min-h-[var(--touch-target-min)] rounded-lg border border-input px-3"
        />
      </AccessibleFormField>

      <AccessibleFormField id="interest-location" label="Suburb or postcode" required>
        <input
          id="interest-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          autoComplete="postal-code"
          className="w-full min-h-[var(--touch-target-min)] rounded-lg border border-input px-3"
        />
      </AccessibleFormField>

      <AccessibleFormField
        id="interest-access"
        label="Access needs or service interest (optional)"
        hint="Only include what you are comfortable sharing"
      >
        <textarea
          id="interest-access"
          value={accessNeedsOrInterest}
          onChange={(e) => setAccessNeedsOrInterest(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-input px-3 py-2"
        />
      </AccessibleFormField>

      <AccessibleFormField id="interest-message" label="Message (optional)">
        <textarea
          id="interest-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-input px-3 py-2"
        />
      </AccessibleFormField>

      <AccessibleFormField
        id="interest-consent"
        label="Consent"
        required
        error={!consent && submitting ? "Consent is required" : undefined}
      >
        <label className="flex min-h-[var(--touch-target-min)] items-start gap-3 text-sm">
          <input
            id="interest-consent"
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            required
            className="mt-1 h-5 w-5"
          />
          <span>
            I agree MapAble may contact me about this request and I have read the{" "}
            <a href="/privacy" className="font-medium text-primary underline">
              privacy notice
            </a>
            .
          </span>
        </label>
      </AccessibleFormField>

      <Button type="submit" variant="default" size="default" loading={submitting} disabled={submitting}>
        Submit interest
      </Button>
    </form>
  );
}
