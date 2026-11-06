"use client";

import { useState } from "react";

import {
  CONTACT_CONSENT_SCOPES,
  ConsentScopeCheckbox,
} from "@/components/consent/ConsentScopeCheckbox";
import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { SensitiveDataBanner } from "@/components/forms/SensitiveDataBanner";
import { MAPABLE_SUPPORT_EMAIL } from "@/lib/brand/constants";
import { MAPABLE_CARE_COMBINED_PHONE } from "@/lib/marketing/mapable-care-combined-data";
import {
  mapablePublicCardClass,
  mapablePublicPrimaryButtonClass,
} from "@/lib/marketing/public-page-styles";

type FieldErrors = Partial<
  Record<"name" | "email" | "organisationName" | "message" | "consent" | "form", string>
>;

export function ProviderInterestForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organisationName, setOrganisationName] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [consentIds, setConsentIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (name.trim().length < 2) nextErrors.name = "Enter your name.";
    if (!email.trim() || !email.includes("@")) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!organisationName.trim()) {
      nextErrors.organisationName = "Enter your organisation name.";
    }
    if (message.trim().length < 20) {
      nextErrors.message = "Please add a few more details (at least 20 characters).";
    }
    if (!consentIds.includes("contact_response") || !consentIds.includes("no_sensitive_upload")) {
      nextErrors.consent = "Confirm both consent statements before sending.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const first = document.getElementById(
        nextErrors.name
          ? "eoi-name"
          : nextErrors.email
            ? "eoi-email"
            : nextErrors.organisationName
              ? "eoi-organisation"
              : nextErrors.message
                ? "eoi-message"
                : "eoi-consent",
      );
      if (first instanceof HTMLElement) first.focus();
      return;
    }

    setErrors({});
    setStatus("loading");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          topic: "provider_pilot",
          organisationName,
          message,
          company,
          consentScopes: consentIds,
        }),
      });
      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        setErrors({ form: data.error ?? "Could not send your interest." });
        setStatus("idle");
        return;
      }
      setSuccessMessage(data.message ?? "Thanks — your interest was received.");
      setStatus("success");
    } catch {
      setErrors({ form: "Network error. Check your connection and try again." });
      setStatus("idle");
    }
  }

  if (status === "success") {
    return (
      <div className={mapablePublicCardClass} role="status">
        <h2 className="text-xl font-black">Interest received</h2>
        <p className="mt-3 text-sm leading-7 text-slate-700">{successMessage}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={mapablePublicCardClass}
      aria-labelledby="eoi-heading"
    >
      <h2 id="eoi-heading" className="text-xl font-black">
        Organisation expression of interest
      </h2>
      <p className="mt-2 text-sm leading-7 text-slate-700">
        This form is for organisations considering a controlled provider pilot.
        It does not create a live website or a payment account.
      </p>
      <SensitiveDataBanner className="mt-4" id="eoi-sensitive" />
      {errors.form ? (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {errors.form}
        </p>
      ) : null}
      <div className="mt-6 space-y-5">
        <AccessibleFormField id="eoi-name" label="Your name" required error={errors.name}>
          <input
            id="eoi-name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={formInputClass}
            aria-invalid={errors.name ? true : undefined}
          />
        </AccessibleFormField>
        <AccessibleFormField id="eoi-email" label="Email address" required error={errors.email}>
          <input
            id="eoi-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={formInputClass}
            aria-invalid={errors.email ? true : undefined}
          />
        </AccessibleFormField>
        <AccessibleFormField
          id="eoi-organisation"
          label="Organisation name"
          required
          error={errors.organisationName}
        >
          <input
            id="eoi-organisation"
            name="organisationName"
            autoComplete="organization"
            value={organisationName}
            onChange={(event) => setOrganisationName(event.target.value)}
            className={formInputClass}
            aria-invalid={errors.organisationName ? true : undefined}
          />
        </AccessibleFormField>
        <AccessibleFormField
          id="eoi-message"
          label="What would you like to explore?"
          hint="Tell us about branded portals, dashboards, support coordination, or service discovery. At least 20 characters."
          required
          error={errors.message}
        >
          <textarea
            id="eoi-message"
            name="message"
            rows={5}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className={formInputClass}
            aria-invalid={errors.message ? true : undefined}
          />
        </AccessibleFormField>
        <div className="absolute left-[-9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
          <label htmlFor="eoi-company">Company</label>
          <input
            id="eoi-company"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
        </div>
        <div id="eoi-consent" tabIndex={-1}>
          <ConsentScopeCheckbox
            scopes={CONTACT_CONSENT_SCOPES}
            checkedIds={consentIds}
            onChange={setConsentIds}
            error={errors.consent}
            requiredScopeIds={["contact_response", "no_sensitive_upload"]}
          />
        </div>
        <button
          type="submit"
          className={mapablePublicPrimaryButtonClass}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Sending…" : "Register provider interest"}
        </button>
      </div>
      <p className="mt-6 text-sm leading-7 text-slate-700">
        Other ways to reach a person: email{" "}
        <a className="font-black text-[#005B7F] underline" href={`mailto:${MAPABLE_SUPPORT_EMAIL}`}>
          {MAPABLE_SUPPORT_EMAIL}
        </a>{" "}
        or call{" "}
        <a className="font-black text-[#005B7F] underline" href="tel:0434083624">
          {MAPABLE_CARE_COMBINED_PHONE}
        </a>
        .
      </p>
    </form>
  );
}
