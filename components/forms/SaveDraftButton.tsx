import type { AutosaveStatus } from "@/lib/hooks/useFormAutosave";

export function SaveDraftButton({
  onSave,
  status,
}: {
  onSave: () => void;
  status: AutosaveStatus;
}) {
  return (
    <button
      type="button"
      onClick={onSave}
      className="min-h-11 rounded-lg border border-border px-4 text-sm font-medium"
      aria-describedby="autosave-status"
    >
      Save draft
      <span id="autosave-status" className="sr-only" aria-live="polite">
        {status === "saving"
          ? "Saving"
          : status === "saved"
            ? "Draft saved"
            : status === "error"
              ? "Save failed"
              : ""}
      </span>
    </button>
  );
}
