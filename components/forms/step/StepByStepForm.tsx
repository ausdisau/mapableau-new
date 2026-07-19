"use client";

import React, { useId, useState } from "react";

import { FormErrorSummary, type FormErrorItem } from "@/components/forms/FormErrorSummary";
import { DraftStatus } from "@/components/forms/step/DraftStatus";
import { TaskIdleWarning } from "@/components/forms/step/TaskIdleWarning";
import { Button } from "@/components/ui/button";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export type StepDefinition = {
  id: string;
  title: string;
  description?: string;
  whyAsking?: string;
  optional?: boolean;
};

export function StepByStepForm({
  steps,
  currentStepId,
  onStepChange,
  errors = [],
  draftMessage,
  draftSaving,
  onSaveDraft,
  showFullForm,
  onToggleFullForm,
  children,
  onBack,
  onContinue,
  continueLabel = "Continue",
  backLabel = "Back",
  hideContinue = false,
}: {
  steps: StepDefinition[];
  currentStepId: string;
  onStepChange?: (stepId: string) => void;
  errors?: FormErrorItem[];
  draftMessage?: string;
  draftSaving?: boolean;
  onSaveDraft?: () => void;
  showFullForm?: boolean;
  onToggleFullForm?: () => void;
  children: React.ReactNode;
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  backLabel?: string;
  hideContinue?: boolean;
}) {
  const headingId = useId();
  const [whyOpen, setWhyOpen] = useState(false);
  const index = Math.max(
    0,
    steps.findIndex((step) => step.id === currentStepId),
  );
  const current = steps[index] ?? steps[0]!;
  const total = steps.length;

  return (
    <div className="space-y-4" data-testid="step-by-step-form">
      <TaskIdleWarning enabled onSaveDraft={onSaveDraft} />
      <header className="space-y-2">
        <p className="text-sm font-semibold text-slate-600">
          Step {index + 1} of {total}: {current.title}
        </p>
        <h2 id={headingId} className="font-heading text-2xl font-black text-[#0C1833]">
          {current.title}
        </h2>
        {current.description ? (
          <p className="max-w-2xl text-sm leading-6 text-slate-600">{current.description}</p>
        ) : null}
        {current.whyAsking ? (
          <div>
            <button
              type="button"
              className={`text-sm font-bold text-[#005B7F] underline underline-offset-2 ${mapableCareFocusRing}`}
              aria-expanded={whyOpen}
              onClick={() => setWhyOpen((open) => !open)}
            >
              Why are we asking?
            </button>
            {whyOpen ? (
              <p className="mt-2 max-w-2xl rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                {current.whyAsking}
              </p>
            ) : null}
          </div>
        ) : null}
      </header>

      <FormErrorSummary errors={errors} />

      <div className="flex flex-wrap items-center gap-3">
        {onToggleFullForm ? (
          <button
            type="button"
            className={`min-h-11 rounded-xl border-2 border-[#0C1833] px-4 text-sm font-black ${mapableCareFocusRing}`}
            onClick={onToggleFullForm}
          >
            {showFullForm ? "Show one step at a time" : "Show full form"}
          </button>
        ) : null}
        {onSaveDraft ? (
          <button
            type="button"
            className={`min-h-11 rounded-xl px-4 text-sm font-bold text-[#005B7F] underline ${mapableCareFocusRing}`}
            onClick={onSaveDraft}
          >
            Save and continue later
          </button>
        ) : null}
        {draftMessage ? (
          <DraftStatus message={draftMessage} saving={draftSaving} />
        ) : null}
      </div>

      <div role="group" aria-labelledby={headingId} className="space-y-4">
        {children}
      </div>

      {!showFullForm ? (
        <div className="flex flex-wrap gap-3 pt-2">
          {onBack && index > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={onBack}
            >
              {backLabel}
            </Button>
          ) : null}
          {!hideContinue && onContinue ? (
            <Button
              type="button"
              variant="default"
              size="default"
              onClick={onContinue}
            >
              {continueLabel}
            </Button>
          ) : null}
        </div>
      ) : null}

      {onStepChange && showFullForm ? (
        <nav aria-label="Form steps" className="pt-2">
          <ol className="flex flex-wrap gap-2">
            {steps.map((step, stepIndex) => (
              <li key={step.id}>
                <button
                  type="button"
                  className={`min-h-11 rounded-xl border px-3 text-sm font-semibold ${mapableCareFocusRing}`}
                  onClick={() => onStepChange(step.id)}
                  aria-current={step.id === currentStepId ? "step" : undefined}
                >
                  {stepIndex + 1}. {step.title}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
    </div>
  );
}
