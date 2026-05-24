"use client";

import { useState } from "react";

import { AccessibleFormField } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const PLACEMENTS = [
  { value: "skyscraper_left", label: "Skyscraper (left)" },
  { value: "skyscraper_right", label: "Skyscraper (right)" },
  { value: "sponsored_provider_card", label: "Sponsored provider card" },
  { value: "banner_inline", label: "Inline banner" },
];

type Step = "basics" | "targeting" | "creative" | "review";

export function AdCampaignWizard({ organisationId }: { organisationId: string }) {
  const [step, setStep] = useState<Step>("basics");
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [placements, setPlacements] = useState<string[]>([
    "sponsored_provider_card",
  ]);
  const [states, setStates] = useState("");
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Learn more");
  const [altText, setAltText] = useState("");
  const [landingUrl, setLandingUrl] = useState("");
  const [imageFileKey, setImageFileKey] = useState<string | null>(null);

  function togglePlacement(value: string) {
    setPlacements((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    );
  }

  async function createCampaign() {
    const res = await fetch("/api/ads/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organisationId,
        name,
        targeting: {
          placements,
          states: states
            ? states.split(",").map((s) => s.trim().toUpperCase())
            : undefined,
          pageContexts: ["provider_finder"],
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to create campaign");
    setCampaignId(data.campaign.id);
    return data.campaign.id as string;
  }

  async function uploadImage(file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/ads/creatives/upload", {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Upload failed");
    setImageFileKey(data.fileKey);
  }

  async function saveCreative(id: string) {
    const res = await fetch(`/api/ads/campaigns/${id}/creatives`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        placements,
        headline,
        body: body || undefined,
        ctaLabel,
        altText,
        landingUrl,
        imageFileKey: imageFileKey ?? undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to save creative");
  }

  async function submitCampaign(id: string) {
    const res = await fetch(`/api/ads/campaigns/${id}/submit`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Submit failed");
    return data.invoiceId as string;
  }

  async function startCheckout(id: string) {
    const res = await fetch(`/api/ads/campaigns/${id}/checkout`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Checkout failed");
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    }
  }

  async function onNext() {
    setSaving(true);
    setError(null);
    try {
      if (step === "basics") {
        setStep("targeting");
      } else if (step === "targeting") {
        setStep("creative");
      } else if (step === "creative") {
        const id = campaignId ?? (await createCampaign());
        setCampaignId(id);
        await saveCreative(id);
        setStep("review");
      } else if (step === "review") {
        const id = campaignId!;
        await submitCampaign(id);
        await startCheckout(id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        Step: {step}
      </p>

      {step === "basics" ? (
        <AccessibleFormField id="name" label="Campaign name" required>
          <input
            id="name"
            className="w-full rounded-lg border border-input px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </AccessibleFormField>
      ) : null}

      {step === "targeting" ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Placements</legend>
          {PLACEMENTS.map((p) => (
            <label key={p.value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={placements.includes(p.value)}
                onChange={() => togglePlacement(p.value)}
              />
              {p.label}
            </label>
          ))}
          <AccessibleFormField
            id="states"
            label="States (comma-separated, optional)"
          >
            <input
              id="states"
              className="w-full rounded-lg border border-input px-3 py-2"
              placeholder="NSW, VIC"
              value={states}
              onChange={(e) => setStates(e.target.value)}
            />
          </AccessibleFormField>
        </fieldset>
      ) : null}

      {step === "creative" ? (
        <div className="space-y-4">
          <AccessibleFormField id="headline" label="Headline" required>
            <input
              id="headline"
              className="w-full rounded-lg border border-input px-3 py-2"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              required
            />
          </AccessibleFormField>
          <AccessibleFormField id="body" label="Body">
            <textarea
              id="body"
              className="w-full rounded-lg border border-input px-3 py-2"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
            />
          </AccessibleFormField>
          <AccessibleFormField id="cta" label="CTA label" required>
            <input
              id="cta"
              className="w-full rounded-lg border border-input px-3 py-2"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
            />
          </AccessibleFormField>
          <AccessibleFormField id="alt" label="Alt text (required)" required>
            <textarea
              id="alt"
              className="w-full rounded-lg border border-input px-3 py-2"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              minLength={10}
              required
            />
          </AccessibleFormField>
          <AccessibleFormField id="url" label="Landing URL" required>
            <input
              id="url"
              type="url"
              className="w-full rounded-lg border border-input px-3 py-2"
              value={landingUrl}
              onChange={(e) => setLandingUrl(e.target.value)}
              required
            />
          </AccessibleFormField>
          <AccessibleFormField id="image" label="Image">
            <input
              id="image"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadImage(f).catch((err) => setError(String(err)));
              }}
            />
          </AccessibleFormField>
        </div>
      ) : null}

      {step === "review" ? (
        <div className="space-y-2 text-sm">
          <p>
            <strong>Name:</strong> {name}
          </p>
          <p>
            <strong>Placements:</strong> {placements.join(", ")}
          </p>
          <p>
            <strong>Headline:</strong> {headline}
          </p>
          <p className="text-muted-foreground">
            Submitting creates an invoice and opens Stripe Checkout. Your campaign
            enters moderation after payment and cannot go live until approved.
          </p>
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      <div className="mt-6 flex gap-2">
        {step !== "basics" ? (
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() =>
              setStep(
                step === "review"
                  ? "creative"
                  : step === "creative"
                    ? "targeting"
                    : "basics"
              )
            }
          >
            Back
          </Button>
        ) : null}
        <Button
          type="button"
          variant="default"
          size="default"
          onClick={() => void onNext()}
          disabled={saving || (step === "basics" && !name)}
        >
          {step === "review" ? (saving ? "Redirecting…" : "Pay & submit") : "Next"}
        </Button>
      </div>
    </Card>
  );
}
