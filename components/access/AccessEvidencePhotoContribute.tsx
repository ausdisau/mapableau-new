"use client";

import { useId, useRef, useState } from "react";

import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";

const ACCEPT = "image/jpeg,image/png,image/webp";

type UploadPhase =
  | "idle"
  | "creating_observation"
  | "requesting_grant"
  | "uploading"
  | "completing"
  | "done"
  | "error";

type Props = {
  placeId: string;
  maxUploadMb: number;
};

export function AccessEvidencePhotoContribute({ placeId, maxUploadMb }: Props) {
  const fileId = useId();
  const featureId = useId();
  const notesId = useId();
  const helpId = useId();
  const statusId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [status, setStatus] = useState("Choose a JPEG, PNG, or WebP photo. No file selected.");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  function resetFile() {
    if (fileRef.current) fileRef.current.value = "";
  }

  function cancel() {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("idle");
    setProgress(null);
    setStatus("Upload cancelled. You can choose another photo.");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const featureKey = String(new FormData(form).get("featureKey") ?? "").trim();
    const notes = String(new FormData(form).get("notes") ?? "").trim();
    const file = fileRef.current?.files?.[0];
    if (!featureKey) {
      setError("Describe the access feature before uploading.");
      return;
    }
    if (!file) {
      setError("Choose a photo using the file picker. Drag-and-drop is not required.");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setPhase("creating_observation");
      setStatus("Creating accessibility observation…");
      const observationRes = await fetch("/api/access-infrastructure/observations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          featureKey,
          ontologyConceptId: featureKey,
          value: notes || true,
          sourceType: "community",
          evidenceKinds: ["photo"],
          placeId,
          entityType: "place",
          entityId: placeId,
        }),
      });
      const observationJson = (await observationRes.json()) as {
        observation?: { id: string; provenance?: { displayLabel: string } };
        error?: string;
      };
      if (!observationRes.ok || !observationJson.observation) {
        throw new Error(observationJson.error ?? "Could not create observation");
      }

      setPhase("requesting_grant");
      setStatus("Requesting a secure upload…");
      const grantRes = await fetch("/api/storage/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          purpose: "access_evidence_photo",
          contentType: file.type || "image/jpeg",
          sizeBytes: file.size,
          originalFilename: file.name,
          placeId,
          observationId: observationJson.observation.id,
        }),
      });
      const grant = (await grantRes.json()) as {
        uploadUrl?: string;
        method?: string;
        headers?: Record<string, string>;
        sessionId?: string;
        completionNonce?: string;
        error?: string;
      };
      if (!grantRes.ok || !grant.uploadUrl || !grant.sessionId || !grant.completionNonce) {
        throw new Error(grant.error ?? "Could not authorise upload");
      }

      setPhase("uploading");
      setProgress(0);
      setStatus("Uploading photo to secure storage…");
      await putWithProgress(grant.uploadUrl, file, grant.headers ?? {}, controller, setProgress);

      setPhase("completing");
      setStatus("Confirming upload…");
      const completeRes = await fetch("/api/storage/uploads/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          sessionId: grant.sessionId,
          completionNonce: grant.completionNonce,
        }),
      });
      const completeJson = (await completeRes.json()) as { error?: string };
      if (!completeRes.ok) {
        throw new Error(completeJson.error ?? "Could not confirm upload");
      }

      setPhase("done");
      setProgress(100);
      const provenance =
        observationJson.observation.provenance?.displayLabel ?? "Community reported";
      setStatus(
        `Upload complete. Evidence saved as ${provenance} — unverified. This is not independently verified.`,
      );
      resetFile();
      form.reset();
    } catch (err) {
      if (controller.signal.aborted) return;
      setPhase("error");
      setProgress(null);
      const message =
        err instanceof Error ? err.message : "Upload failed. You can retry from the file picker.";
      setError(message);
      setStatus("Upload did not complete. Use Retry after fixing the problem.");
    } finally {
      abortRef.current = null;
    }
  }

  const busy =
    phase === "creating_observation" ||
    phase === "requesting_grant" ||
    phase === "uploading" ||
    phase === "completing";

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-[#F6FBFC] p-5"
      aria-labelledby="evidence-upload-heading"
    >
      <h2 id="evidence-upload-heading" className="text-lg font-semibold text-[#0C1833]">
        Add photo evidence
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Community photos help others plan. They are stored as community reported
        and are never treated as independently verified. Do not upload photos of
        people or private documents.
      </p>
      <p id={helpId} className="mt-2 text-sm text-slate-600">
        Accepted formats: JPEG, PNG, WebP. Maximum size {maxUploadMb} MB. Use the
        file picker — drag-and-drop is not required.
      </p>

      <form className="mt-4 space-y-4" onSubmit={onSubmit}>
        <label className="block" htmlFor={featureId}>
          <span className="text-sm font-semibold text-[#0C1833]">Access feature</span>
          <input
            id={featureId}
            name="featureKey"
            required
            maxLength={200}
            placeholder="e.g. entrance.step_free"
            className={`mt-1 min-h-11 w-full rounded-lg border px-3 ${mapableInteractiveFocusRing}`}
          />
        </label>
        <label className="block" htmlFor={notesId}>
          <span className="text-sm font-semibold text-[#0C1833]">
            Notes (optional)
          </span>
          <textarea
            id={notesId}
            name="notes"
            rows={3}
            maxLength={500}
            className={`mt-1 w-full rounded-lg border px-3 py-2 ${mapableInteractiveFocusRing}`}
          />
        </label>
        <label className="block" htmlFor={fileId}>
          <span className="text-sm font-semibold text-[#0C1833]">Photo</span>
          <input
            ref={fileRef}
            id={fileId}
            name="photo"
            type="file"
            accept={ACCEPT}
            aria-describedby={`${helpId} ${statusId}`}
            className={`mt-1 block w-full min-h-11 text-sm ${mapableInteractiveFocusRing}`}
          />
        </label>

        <div
          id={statusId}
          role="status"
          aria-live="polite"
          className="text-sm text-slate-700"
        >
          {status}
          {progress != null ? ` ${progress} percent.` : ""}
        </div>
        {progress != null ? (
          <div
            className="h-2 overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Upload progress"
          >
            <div
              className="h-full bg-[#005B7F]"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}
        {error ? (
          <p className="text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy}
            className={`min-h-11 rounded-lg bg-[#005B7F] px-4 text-sm font-semibold text-white disabled:opacity-60 ${mapableInteractiveFocusRing}`}
          >
            {phase === "error" ? "Retry upload" : "Upload photo evidence"}
          </button>
          {busy ? (
            <button
              type="button"
              onClick={cancel}
              className={`min-h-11 rounded-lg border px-4 text-sm ${mapableInteractiveFocusRing}`}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

function putWithProgress(
  url: string,
  file: File,
  headers: Record<string, string>,
  controller: AbortController,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error("The storage service rejected the file."));
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.onabort = () => reject(new DOMException("Aborted", "AbortError"));
    controller.signal.addEventListener("abort", () => xhr.abort());
    xhr.send(file);
  });
}
