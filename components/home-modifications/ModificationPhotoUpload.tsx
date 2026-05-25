"use client";

import { MapAbleCard, MapAbleStatusBadge } from "@/components/shared/MapAbleModuleUi";

export function ModificationPhotoUpload({ requestId }: { requestId: string }) {
  async function handleUpload() {
    await fetch(`/api/home-modifications/requests/${requestId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: "access-photo-placeholder.jpg",
        mimeType: "image/jpeg",
        documentType: "photo",
      }),
    });
  }

  return (
    <MapAbleCard title="Photos & documents">
      <p className="text-sm text-muted-foreground">
        Documents and photos are private by default. You choose who can see them.
      </p>
      <p className="mt-2">
        <MapAbleStatusBadge status="document_private" />
      </p>
      <button type="button" onClick={handleUpload} className="mt-4 min-h-11 rounded-lg border px-4 py-2">
        Upload photo placeholder
      </button>
    </MapAbleCard>
  );
}
