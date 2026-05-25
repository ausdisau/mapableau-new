"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FloorPlanUploadForm({
  placeId,
  placeOptions = [],
}: {
  placeId?: string;
  placeOptions?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setBusy(true);
    const targetPlaceId = placeId ?? String(formData.get("placeId") ?? "");
    formData.delete("placeId");

    try {
      const res = await fetch(
        `/api/access/places/${targetPlaceId}/floor-plans`,
        {
          method: "POST",
          body: formData,
        },
      );
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? "Floor-plan upload failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      action={onSubmit}
      className="space-y-4 rounded-lg border border-border p-4"
    >
      <h2 className="text-lg font-semibold">Upload floor plan</h2>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {!placeId ? (
        <label className="block text-sm">
          Venue
          <select
            name="placeId"
            required
            className="mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3"
          >
            <option value="">Select a venue</option>
            {placeOptions.map((place) => (
              <option key={place.id} value={place.id}>
                {place.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="block text-sm">
        Title
        <input
          name="title"
          required
          className="mt-1 min-h-11 w-full rounded-md border border-border px-3"
          placeholder="Ground floor access plan"
        />
      </label>
      <label className="block text-sm">
        Level / floor label
        <input
          name="levelLabel"
          className="mt-1 min-h-11 w-full rounded-md border border-border px-3"
          placeholder="Ground floor"
        />
      </label>
      <label className="block text-sm">
        Floor-plan file
        <input
          name="file"
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          required
          className="mt-1 block w-full"
        />
      </label>
      <label className="block text-sm">
        Alt text
        <textarea
          name="altText"
          required
          className="mt-1 min-h-24 w-full rounded-md border border-border p-3"
          placeholder="Describe the floor plan for people who cannot see the image."
        />
      </label>
      <label className="block text-sm">
        Public planning notes
        <textarea
          name="publicNotes"
          className="mt-1 min-h-24 w-full rounded-md border border-border p-3"
          placeholder="Entry instructions, best accessible route, known barriers..."
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          Image width (optional)
          <input
            name="width"
            type="number"
            min="1"
            className="mt-1 min-h-11 w-full rounded-md border border-border px-3"
          />
        </label>
        <label className="block text-sm">
          Image height (optional)
          <input
            name="height"
            type="number"
            min="1"
            className="mt-1 min-h-11 w-full rounded-md border border-border px-3"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground disabled:opacity-60"
      >
        {busy ? "Uploading..." : "Upload draft floor plan"}
      </button>
    </form>
  );
}
