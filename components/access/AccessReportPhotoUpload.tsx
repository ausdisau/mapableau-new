"use client";

import { useState } from "react";

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
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setError("Choose a photo to upload");
      return;
    }
    if (!consent) {
      setError("Confirm the photo privacy statement before uploading");
      return;
    }
    if (!altText.trim()) {
      setError("Alt text is required — describe the access feature, not people");
      return;
    }

    setBusy(true);
    const upload = new FormData();
    upload.set("file", file);
    upload.set("altText", altText);
    upload.set("photoConsent", "true");

    const res = await fetch(`/api/access/reports/${reportId}/photos`, {
      method: "POST",
      body: upload,
    });
    setBusy(false);

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(typeof j.error === "string" ? j.error : "Upload failed");
      return;
    }
    setAltText("");
    onUploaded?.();
  }

  return (
    <form className="space-y-3 rounded-lg border p-4" onSubmit={onSubmit}>
      <h3 className="font-medium">Add a photo</h3>
      <p className="text-sm text-muted-foreground">
        Do not photograph strangers or private homes. Photos are reviewed before
        appearing publicly.
      </p>

      <label className="block text-sm">
        <span className="font-medium">Photo</span>
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp"
          className="mt-1 block w-full min-h-11"
          aria-describedby="photo-help"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium">Alt text</span>
        <input
          type="text"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          className="mt-1 block w-full min-h-11 rounded border px-3"
          placeholder="e.g. Ramp at side entrance, about 1:12 gradient"
          maxLength={500}
          required
        />
      </label>

      <label className="flex min-h-11 items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1"
        />
        <span id="photo-help">
          I confirm this photo shows access features only and does not include
          identifiable people.
        </span>
      </label>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground"
        disabled={busy}
      >
        {busy ? "Uploading…" : "Upload photo"}
      </button>
    </form>
  );
}
