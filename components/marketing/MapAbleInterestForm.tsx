"use client";

import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import {
  INTEREST_ROLES,
  interestRoleLabels,
  type InterestRole,
} from "@/lib/contact/interest-form-schema";
import { getProposedVerticals } from "@/lib/mapable/verticals";
import {
  mapablePublicCardClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSectionTitleClass,
} from "@/lib/marketing/public-page-styles";

type FieldErrors = Partial<
  Record<
    | "name"
    | "email"
    | "role"
    | "interestedVerticals"
    | "location"
    | "message"
    | "consentContact"
    | "form",
    string
  >
>;

export type MapAbleInterestFormProps = {
  defaultVerticalIds?: string[];
  submitLabel?: string;
};

export function MapAbleInterestForm({
  defaultVerticalIds = [],
  submitLabel = "Submit interest",
}: MapAbleInterestFormProps) {
  const verticalOptions = getProposedVerticals();
  const [name, setName] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<InterestRole>("participant");
  const [interestedVerticals, setInterestedVerticals] = useState<string[]>(
    defaultVerticalIds,
  );
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [consentContact, setConsentContact] = useState(false);
  const [consentTesting, setConsentTesting] = useState(false);
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [successMessage, setSuccessMessage] = useState("");

  function toggleVertical(id: string) {
    setInterestedVerticals((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setStatus("loading");

    try {
      const response = await fetch("/api/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          organisation: organisation || undefined,
          email,
          phone: phone || undefined,
          role,
          interestedVerticals,
          location,
          message,
          consentContact,
          consentTesting,
          company,
        }),
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setErrors({ form: data.error ?? "Could not send your enquiry." });
        setStatus("error");
        return;
      }

      setSuccessMessage(data.message ?? "Thanks — your interest was received.");
      setStatus("success");
      setName("");
      setOrganisation("");
      setEmail("");
      setPhone("");
      setRole("participant");
      setInterestedVerticals(defaultVerticalIds);
      setLocation("");
      setMessage("");
      setConsentContact(false);
      setConsentTesting(false);
      setCompany("");
    } catch {
      setErrors({
        form: "Network error. Check your connection and try again.",
      });
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        className={`${mapablePublicCardClass} border-[#005B7F]/15 bg-[#F6FBFC]`}
        role="status"
        aria-live="polite"
      >
        <p className={mapablePublicSectionTitleClass}>Enquiry received</p>
        <p className="mt-3 text-sm leading-7 text-slate-700">{successMessage}</p>
        <button
          type="button"
          className={`${mapablePublicPrimaryButtonClass} mt-6`}
          onClick={() => setStatus("idle")}
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={`${mapablePublicCardClass} space-y-5`}
      aria-label="MapAble interest form"
    >
      {errors.form ? (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {errors.form}
        </p>
      ) : null}

      <div className="sr-only" aria-hidden="true">
        <label htmlFor="interest-company">Company</label>
        <input
          id="interest-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      <AccessibleFormField id="interest-name" label="Your name" required error={errors.name}>
        <input
          id="interest-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className={formInputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </AccessibleFormField>

      <AccessibleFormField
        id="interest-organisation"
        label="Organisation"
        hint="Optional"
      >
        <input
          id="interest-organisation"
          name="organisation"
          type="text"
          autoComplete="organization"
          className={formInputClass}
          value={organisation}
          onChange={(e) => setOrganisation(e.target.value)}
        />
      </AccessibleFormField>

      <AccessibleFormField id="interest-email" label="Email" required error={errors.email}>
        <input
          id="interest-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={formInputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </AccessibleFormField>

      <AccessibleFormField id="interest-phone" label="Phone" hint="Optional">
        <input
          id="interest-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          className={formInputClass}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </AccessibleFormField>

      <AccessibleFormField id="interest-role" label="Your role" required error={errors.role}>
        <select
          id="interest-role"
          name="role"
          required
          className={formInputClass}
          value={role}
          onChange={(e) => setRole(e.target.value as InterestRole)}
        >
          {INTEREST_ROLES.map((r) => (
            <option key={r} value={r}>
              {interestRoleLabels[r]}
            </option>
          ))}
        </select>
      </AccessibleFormField>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium">
          Interested verticals <span className="text-destructive">*</span>
        </legend>
        {errors.interestedVerticals ? (
          <p role="alert" className="mb-2 text-sm text-destructive">
            {errors.interestedVerticals}
          </p>
        ) : null}
        <div className="grid gap-2 sm:grid-cols-2">
          {verticalOptions.map((v) => (
            <label
              key={v.id}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                name="interestedVerticals"
                value={v.id}
                checked={interestedVerticals.includes(v.id)}
                onChange={() => toggleVertical(v.id)}
                className="h-4 w-4 rounded border-slate-300"
              />
              {v.shortName}
            </label>
          ))}
        </div>
      </fieldset>

      <AccessibleFormField
        id="interest-location"
        label="Location / region"
        required
        error={errors.location}
      >
        <input
          id="interest-location"
          name="location"
          type="text"
          required
          className={formInputClass}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </AccessibleFormField>

      <AccessibleFormField
        id="interest-message"
        label="Message"
        required
        hint="Tell us what you are looking for or how you would like to partner."
        error={errors.message}
      >
        <textarea
          id="interest-message"
          name="message"
          required
          rows={5}
          className={formInputClass}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </AccessibleFormField>

      <div className="space-y-3">
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="consentContact"
            required
            checked={consentContact}
            onChange={(e) => setConsentContact(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          <span>
            I agree to be contacted by MapAble about this enquiry.{" "}
            <span className="text-destructive">*</span>
          </span>
        </label>
        {errors.consentContact ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.consentContact}
          </p>
        ) : null}

        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            name="consentTesting"
            checked={consentTesting}
            onChange={(e) => setConsentTesting(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          <span>
            I would like to help test accessible, plain-language product concepts.
          </span>
        </label>
      </div>

      <p className="text-xs leading-5 text-slate-500">
        MapAble handles your information in line with our{" "}
        <a href="/privacy" className="font-semibold text-[#005B7F] underline">
          Privacy Policy
        </a>
        . We will only use your details for this enquiry unless you agree otherwise.
      </p>

      <button
        type="submit"
        disabled={status === "loading"}
        className={mapablePublicPrimaryButtonClass}
      >
        {status === "loading" ? "Sending…" : submitLabel}
      </button>
    </form>
  );
}
