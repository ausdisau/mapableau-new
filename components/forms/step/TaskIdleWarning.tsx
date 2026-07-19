"use client";

import { useEffect, useId, useRef, useState } from "react";

import { useAccessibilityPreferencesOptional } from "@/components/accessibility/AccessibilityPreferencesProvider";
import { Button } from "@/components/ui/button";
import {
  documentLongerTaskTimeEnabled,
  resolveTaskIdleMs,
} from "@/lib/forms/task-idle";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

/**
 * Warns after inactivity on multi-step tasks. Longer warning delay when
 * `longerTaskTime` preference (or data-a11y-longer-tasks) is enabled.
 */
export function TaskIdleWarning({
  enabled = true,
  onSaveDraft,
  onContinueWorking,
}: {
  enabled?: boolean;
  onSaveDraft?: () => void;
  onContinueWorking?: () => void;
}) {
  const prefs = useAccessibilityPreferencesOptional();
  const longer =
    prefs?.preferences.longerTaskTime ?? documentLongerTaskTimeEnabled();
  const idleMs = resolveTaskIdleMs(longer);
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const continueRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setOpen(true), idleMs);
    }

    function onActivity() {
      if (open) return;
      resetTimer();
    }

    resetTimer();
    const events: Array<keyof WindowEventMap> = [
      "keydown",
      "pointerdown",
      "mousemove",
      "touchstart",
      "scroll",
    ];
    for (const event of events) {
      window.addEventListener(event, onActivity, { passive: true });
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const event of events) {
        window.removeEventListener(event, onActivity);
      }
    };
  }, [enabled, idleMs, open]);

  useEffect(() => {
    if (open) continueRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        onContinueWorking?.();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onContinueWorking]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[75] flex items-end justify-center bg-[#0C1833]/45 p-4 sm:items-center"
      data-testid="task-idle-warning"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h2 id={titleId} className="text-xl font-black text-[#0C1833]">
          Still working on this?
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          You have been inactive for a while. Your answers stay on this page.
          {longer
            ? " Longer task time is on, so this reminder waited longer."
            : null}{" "}
          You can keep going or save a draft.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            ref={continueRef}
            type="button"
            variant="default"
            size="default"
            className={mapableCareFocusRing}
            onClick={() => {
              setOpen(false);
              onContinueWorking?.();
            }}
          >
            Continue working
          </Button>
          {onSaveDraft ? (
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => {
                onSaveDraft();
                setOpen(false);
              }}
            >
              Save draft
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
