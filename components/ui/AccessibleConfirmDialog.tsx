"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import { StatusMessage } from "@/components/ui/StatusMessage";

type AccessibleConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "destructive" | "outline" | "secondary";
  loading?: boolean;
  error?: string | null;
  onConfirm: (inputValue: string) => void | Promise<void>;
  /** When set, shows a labelled textarea and passes its value to onConfirm. */
  inputLabel?: string;
  inputHint?: string;
  inputRequired?: boolean;
  inputMinLength?: number;
  inputPlaceholder?: string;
  children?: ReactNode;
};

export function AccessibleConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "default",
  loading = false,
  error,
  onConfirm,
  inputLabel,
  inputHint,
  inputRequired = false,
  inputMinLength,
  inputPlaceholder,
  children,
}: AccessibleConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();
  const inputId = useId();
  const hintId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setInputValue("");
      setValidationError(null);
      const timer = window.setTimeout(() => cancelRef.current?.focus(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  if (!open) return null;

  async function handleConfirm() {
    const trimmed = inputValue.trim();
    if (inputLabel && inputRequired && !trimmed) {
      setValidationError("This field is required.");
      return;
    }
    if (inputMinLength != null && trimmed.length < inputMinLength) {
      setValidationError(`Please enter at least ${inputMinLength} characters.`);
      return;
    }
    setValidationError(null);
    await onConfirm(trimmed);
  }

  const describedBy = [description ? descId : null, inputHint ? hintId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={describedBy || undefined}
    >
      <div className="max-w-md w-full rounded-xl border border-border bg-card p-6 shadow-lg space-y-4">
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        {description ? (
          <p id={descId} className="text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
        {children}
        {inputLabel ? (
          <div className="space-y-2">
            <label htmlFor={inputId} className="block text-sm font-medium">
              {inputLabel}
              {inputRequired ? (
                <span className="sr-only"> (required)</span>
              ) : null}
            </label>
            {inputHint ? (
              <p id={hintId} className="text-sm text-muted-foreground">
                {inputHint}
              </p>
            ) : null}
            <textarea
              id={inputId}
              className={formInputClass}
              rows={3}
              value={inputValue}
              placeholder={inputPlaceholder}
              aria-invalid={validationError ? true : undefined}
              aria-describedby={describedBy || undefined}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (validationError) setValidationError(null);
              }}
            />
            {validationError ? (
              <p role="alert" className="text-sm text-destructive">
                {validationError}
              </p>
            ) : null}
          </div>
        ) : null}
        {error ? <StatusMessage variant="error" message={error} /> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            ref={cancelRef}
            type="button"
            variant="outline"
            size="default"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            size="default"
            loading={loading}
            onClick={() => void handleConfirm()}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
