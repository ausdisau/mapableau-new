import type { AutosaveStatus } from "@/lib/hooks/useFormAutosave";

export function FormAutosaveStatus({ status }: { status: AutosaveStatus }) {
  if (status === "idle") return null;
  const text =
    status === "saving"
      ? "Saving…"
      : status === "saved"
        ? "Draft saved on this device"
        : "Could not save draft";

  return (
    <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
      {text}
    </p>
  );
}
