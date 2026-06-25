"use client";

import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import { ACCESS_LABELS } from "@/lib/access-map/copy";

export function AccessReportPhotoUpload({
  reportId,
  onUploaded,
}: {
  reportId: string;
  onUploaded?: () => void;
}) {
  const [altText, setAltText] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const file = fd.get("photo");
    if (!(file instanceof File) || !file.size) {
      setError("Please choose a photo");
      return;
    }

    setLoading(true);
    const uploadData = new FormData();
    uploadData.set("photo", file);
    uploadData.set("altText", altText);
    uploadData.set("consent", String(consent));

    const res = await fetch(`/api/access/reports/${reportId}/photos`, {
      method: "POST",
      body: uploadData,
    });
    setLoading(false);

    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? "Upload failed");
      return;
    }

    setSuccess(true);
    onUploaded?.();
  }

  if (success) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Photo uploaded and pending review.
      </p>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <p className="text-sm text-muted-foreground">{ACCESS_LABELS.photoConsentWarning}</p>

      <AccessibleFormField
        id="photo-alt"
        label="Describe the photo for screen reader users"
        hint="Example: Wide view of ramp entrance with handrail on left side"
        required
      >
        <input
          id="photo-alt"
          className={formInputClass}
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          minLength={5}
          required
        />
      </AccessibleFormField>

      <AccessibleFormField id="photo-file" label="Photo" required>
        <input
          id="photo-file"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className={formInputClass}
          required
        />
      </AccessibleFormField>

      <label className="flex min-h-11 items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
          className="mt-1"
        />
        <span>
          I confirm this photo does not show identifiable people without their
          consent
        </span>
      </label>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="default" size="default" loading={loading}>
        Upload photo
      </Button>
    </form>
  );
}
