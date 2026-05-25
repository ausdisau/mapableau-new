"use client";

import { MobileFormShell } from "@/components/forms/MobileFormShell";
import { LargeTextInput } from "@/components/forms/LargeTextInput";
import { SaveDraftButton } from "@/components/forms/SaveDraftButton";
import { StickyFormActions } from "@/components/forms/StickyFormActions";
import { OfflineDraftIndicator } from "@/components/field/OfflineDraftIndicator";
import { useFormAutosave } from "@/lib/hooks/useFormAutosave";
import { useOfflineQueue } from "@/lib/hooks/useOfflineQueue";

export function ServiceLogMobileForm({ shiftId }: { shiftId: string }) {
  const draftKey = `service-log:${shiftId}`;
  const { value, setValue, status } = useFormAutosave(draftKey, "");
  const { hasDraft } = useOfflineQueue(draftKey);

  return (
    <MobileFormShell
      title="Service log"
      description="Record what support was delivered. Drafts save locally when offline."
    >
      <OfflineDraftIndicator visible={hasDraft || status === "saved"} />
      <LargeTextInput
        id="service-log-notes"
        label="What support did you provide?"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={6}
        helperText="Use plain language. Do not include clinical diagnosis."
      />
      <StickyFormActions>
        <SaveDraftButton
          onSave={() => setValue(value)}
          status={status}
        />
        <button
          type="button"
          className="min-h-11 flex-1 rounded-lg bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-50"
          disabled={!value.trim()}
        >
          Submit when online
        </button>
      </StickyFormActions>
    </MobileFormShell>
  );
}
