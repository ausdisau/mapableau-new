"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

const REQUEST_TYPES = [
  "personal_care",
  "domestic_assistance",
  "community_access",
  "appointment_support",
  "employment_support",
  "other",
] as const;

const STEPS = ["What you need", "When and where", "Accessibility", "Review"];

export function CareRequestWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    requestType: "personal_care",
    title: "",
    description: "",
    address: "",
    linkedTransport: false,
    shareAccessibility: false,
    accessSummary: "",
  });

  async function submit() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/care/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestType: form.requestType,
        title: form.title,
        description: form.description,
        address: form.address,
        linkedTransportRequired: form.linkedTransport,
        shareAccessibility: form.shareAccessibility,
        shareAccessibilityConfirmed: form.shareAccessibility,
        accessRequirementsSummary: form.accessSummary || undefined,
      }),
    });
    const d = await res.json();
    if (!res.ok) {
      setLoading(false);
      setError(d.error ?? "Could not create request");
      return;
    }
    const submitRes = await fetch(
      `/api/care/requests/${d.request.id}/submit`,
      { method: "POST" },
    );
    setLoading(false);
    if (!submitRes.ok) {
      const sd = await submitRes.json();
      setError(sd.error ?? "Created but could not submit");
      router.push(`/dashboard/care/${d.request.id}`);
      return;
    }
    router.push(`/dashboard/care/${d.request.id}`);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <nav aria-label="Care request steps">
        <ol className="flex flex-wrap gap-2">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={`rounded-lg border px-3 py-1 text-sm ${
                i === step ? "border-primary bg-primary/10 font-semibold" : ""
              }`}
              aria-current={i === step ? "step" : undefined}
            >
              {i + 1}. {label}
            </li>
          ))}
        </ol>
      </nav>

      {error ? (
        <div role="alert" className="rounded-lg border border-destructive p-3 text-sm">
          {error}
        </div>
      ) : null}

      {step === 0 && (
        <div className="space-y-4">
          <h1 className="font-heading text-2xl font-bold">Tell us what support you need</h1>
          <label className="block text-sm font-medium">
            Type of support
            <select
              className={formInputClass}
              value={form.requestType}
              onChange={(e) =>
                setForm((f) => ({ ...f, requestType: e.target.value }))
              }
            >
              {REQUEST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Short title
            <input
              className={formInputClass}
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </label>
          <label className="block text-sm font-medium">
            Details
            <textarea
              className={`${formInputClass} min-h-[120px]`}
              required
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </label>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-heading text-xl font-semibold">When and where</h2>
          <label className="block text-sm font-medium">
            Address or location
            <input
              className={formInputClass}
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 size-5"
              checked={form.linkedTransport}
              onChange={(e) =>
                setForm((f) => ({ ...f, linkedTransport: e.target.checked }))
              }
            />
            I also need transport to or from this support
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-heading text-xl font-semibold">Accessibility</h2>
          <p className="text-sm text-muted-foreground">
            You choose what to share. Providers only see this if you consent.
          </p>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 size-5"
              checked={form.shareAccessibility}
              onChange={(e) =>
                setForm((f) => ({ ...f, shareAccessibility: e.target.checked }))
              }
            />
            Share accessibility information with assigned providers
          </label>
          <label className="block text-sm font-medium">
            Accessibility notes
            <textarea
              className={`${formInputClass} min-h-[100px]`}
              value={form.accessSummary}
              onChange={(e) =>
                setForm((f) => ({ ...f, accessSummary: e.target.value }))
              }
            />
          </label>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="font-heading text-xl font-semibold">Review and send</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="font-medium text-muted-foreground">Title</dt>
              <dd>{form.title}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Transport</dt>
              <dd>{form.linkedTransport ? "Yes, link transport" : "No"}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {step > 0 && (
          <Button
            type="button"
            variant="secondary"
            size="default"
            onClick={() => setStep((s) => s - 1)}
            disabled={loading}
          >
            Back
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={() => setStep((s) => s + 1)}
          >
            Continue
          </Button>
        ) : (
          <Button
            type="button"
            variant="default"
            size="lg"
            disabled={loading}
            onClick={() => void submit()}
          >
            Send request
          </Button>
        )}
      </div>
    </div>
  );
}
