"use client";

import { useState } from "react";

export default function NdisPlanUploadPage() {
  const [uploadId, setUploadId] = useState<string | null>(null);

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/ndis-plan/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: String(form.get("fileName")) }),
    });
    const data = await res.json();
    setUploadId(data.upload?.id);
  }

  return (
    <main className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="font-heading text-2xl font-bold">Upload NDIS plan</h1>
      <p className="text-sm text-muted-foreground">
        Your plan is sensitive. Nothing is saved from extraction until you review and
        confirm. This is not legal or funding advice.
      </p>
      <form onSubmit={upload} className="space-y-3">
        <label htmlFor="fileName" className="block text-sm font-medium">
          File name
        </label>
        <input id="fileName" name="fileName" required className="min-h-11 w-full rounded border px-3" />
        <button type="submit" className="min-h-11 rounded bg-primary px-4 text-primary-foreground">
          Upload for review
        </button>
      </form>
      {uploadId ? (
        <p>
          <a href={`/ndis-plan/review/${uploadId}`} className="text-primary underline">
            Continue to review
          </a>
        </p>
      ) : null}
    </main>
  );
}
