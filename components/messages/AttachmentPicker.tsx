"use client";

import { formInputClass } from "@/components/forms/AccessibleFormField";

export function AttachmentPicker({
  documentIds,
  onChange,
  disabled,
}: {
  documentIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor="attachment-doc-id" className="text-sm font-medium">
        Attach from Document Vault (document ID)
      </label>
      <input
        id="attachment-doc-id"
        className={formInputClass}
        placeholder="Paste document ID"
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const value = (e.target as HTMLInputElement).value.trim();
            if (value && !documentIds.includes(value)) {
              onChange([...documentIds, value]);
              (e.target as HTMLInputElement).value = "";
            }
          }
        }}
      />
      {documentIds.length ? (
        <ul className="text-xs text-muted-foreground" aria-label="Selected attachments">
          {documentIds.map((id) => (
            <li key={id} className="flex items-center justify-between gap-2">
              <span>{id}</span>
              <button
                type="button"
                className="min-h-9 rounded px-2 text-destructive underline"
                onClick={() => onChange(documentIds.filter((d) => d !== id))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Attachments follow Document Vault permissions for each file.
      </p>
    </div>
  );
}
