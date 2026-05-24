"use client";

import { useId, useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export function WwcEvidenceUpload({
  onUploaded,
}: {
  onUploaded: (documentId: string) => void;
}) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [documentId, setDocumentId] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    form.append("title", "WWC evidence");
    form.append("category", "worker_screening");
    form.append("visibility", "admin_only");

    const res = await fetch("/api/documents", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(data.error ?? "Upload failed");
      return;
    }
    const id = data.document?.id as string;
    setDocumentId(id);
    onUploaded(id);
  }

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium">
        Upload evidence (optional)
      </label>
      <p className="text-sm text-muted-foreground" id={`${inputId}-hint`}>
        Upload a PDF or image of your check result. Evidence is private and only visible to authorised reviewers.
      </p>
      <input
        id={inputId}
        type="file"
        accept=".pdf,image/*"
        className={formInputClass}
        aria-describedby={`${inputId}-hint`}
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleUpload(file);
        }}
      />
      {documentId ? (
        <p role="status" className="text-sm text-green-700 dark:text-green-400">
          Evidence uploaded successfully.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {uploading ? (
        <Button type="button" variant="outline" size="sm" loading disabled>
          Uploading…
        </Button>
      ) : null}
    </div>
  );
}
