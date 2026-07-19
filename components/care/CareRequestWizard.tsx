"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

import { AuthAlert } from "@/components/auth/AuthAlert";
import { CarePlanDraftReview } from "@/components/care/CarePlanDraftReview";
import {
  SupportTypeChips,
  type CareRequestTypeValue,
} from "@/components/care/SupportTypeChips";
import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { FormErrorSummary } from "@/components/forms/FormErrorSummary";
import { StepByStepForm } from "@/components/forms/step/StepByStepForm";
import { ConsistentHelp } from "@/components/help/ConsistentHelp";
import { Button } from "@/components/ui/button";
import {
  composeCareSupportMessage,
  type CareIntakeTaskRow,
} from "@/lib/care/compose-care-message";
import {
  clearLocalDraft,
  loadLocalDraft,
  sanitizeLocalDraftPayload,
  saveLocalDraft,
} from "@/lib/form-drafts/draft-storage";
import type { CareSupportTransformOutput } from "@/server/agents/care/types";

const CARE_DRAFT_KEY = "care-request-wizard";

function newSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}`;
}

function emptyTask(): CareIntakeTaskRow {
  return { name: "", intensity: "standard" };
}

export function CareRequestWizard({
  redirectBase = "/care",
  participantId,
  preferredOrganisationId: _preferredOrganisationId,
  preferredProviderName,
}: {
  redirectBase?: string;
  participantId?: string;
  preferredOrganisationId?: string;
  preferredProviderName?: string;
}) {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const sessionId = useMemo(() => newSessionId(), []);
  const localDraft = useMemo(() => loadLocalDraft(CARE_DRAFT_KEY), []);

  const [step, setStep] = useState<"describe" | "tasks" | "access" | "review">(
    "describe",
  );
  const [requestType, setRequestType] =
    useState<CareRequestTypeValue>(
      (localDraft?.payload.requestType as CareRequestTypeValue) ||
        "personal_care",
    );
  const [title, setTitle] = useState((localDraft?.payload.title as string) || "");
  const [description, setDescription] = useState(
    (localDraft?.payload.description as string) || "",
  );
  const [address, setAddress] = useState(
    (localDraft?.payload.address as string) || "",
  );
  const [tasks, setTasks] = useState<CareIntakeTaskRow[]>(
    (localDraft?.payload.tasks as CareIntakeTaskRow[]) || [
      { name: "", intensity: "standard" },
    ],
  );
  const [shareAccessibility, setShareAccessibility] = useState(
    Boolean(localDraft?.payload.shareAccessibility),
  );
  const [accessSummary, setAccessSummary] = useState(
    (localDraft?.payload.accessSummary as string) || "",
  );
  const [linkedTransport, setLinkedTransport] = useState(
    Boolean(localDraft?.payload.linkedTransport),
  );

  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState(
    localDraft
      ? "Progress restored on this device (safe selections only). Care description and address are not stored in the browser — sign in to resume full drafts from your account."
      : "",
  );
  const [draftSaving, setDraftSaving] = useState(false);
  const [transformOutput, setTransformOutput] =
    useState<CareSupportTransformOutput | null>(null);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    void fetch(`/api/form-drafts?workflowKey=${encodeURIComponent(CARE_DRAFT_KEY)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { draft?: { payload?: Record<string, unknown>; stepId?: string } | null } | null) => {
        const draft = data?.draft;
        if (!draft?.payload) return;
        if (typeof draft.payload.title === "string") setTitle(draft.payload.title);
        if (typeof draft.payload.description === "string") {
          setDescription(draft.payload.description);
        }
        if (draft.stepId === "tasks" || draft.stepId === "access") {
          setStep(draft.stepId);
        }
        setDraftMessage("Draft restored from your MapAble account.");
      })
      .catch(() => undefined);
  }, [sessionStatus]);

  async function persistDraft(currentStep: string) {
    setDraftSaving(true);
    const fullPayload = {
      requestType,
      title,
      description,
      address,
      tasks,
      shareAccessibility,
      accessSummary,
      linkedTransport,
      stepId: currentStep,
    };
    // Local device: allowlisted progress only — never care free text by default.
    saveLocalDraft({
      workflowKey: CARE_DRAFT_KEY,
      stepId: currentStep,
      payload: sanitizeLocalDraftPayload(CARE_DRAFT_KEY, fullPayload),
    });
    if (sessionStatus === "authenticated") {
      await fetch("/api/form-drafts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowKey: CARE_DRAFT_KEY,
          stepId: currentStep,
          payload: fullPayload,
        }),
      }).catch(() => undefined);
    }
    setDraftSaving(false);
    setDraftMessage("Draft saved. You can leave and resume later.");
  }

  const assessmentSignals = useMemo(() => {
    const signals: Record<string, unknown> = {};
    if (tasks.some((t) => t.intensity === "high")) {
      signals.manualHandling = true;
    }
    return signals;
  }, [tasks]);

  async function handleContinueToReview(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    if (trimmedTitle.length < 3) {
      setError("Please add a short title (at least 3 characters).");
      return;
    }
    if (trimmedDescription.length < 1) {
      setError("Please describe what support you need.");
      return;
    }

    const taskRows = tasks
      .map((t) => ({ ...t, name: t.name.trim() }))
      .filter((t) => t.name.length > 0);
    if (taskRows.length === 0) {
      setError("Add at least one support task, or describe tasks in your details.");
      return;
    }

    setLoading(true);
    try {
      const message = composeCareSupportMessage({
        requestType,
        title: trimmedTitle,
        description: trimmedDescription,
        tasks: taskRows,
        address: address.trim() || undefined,
        linkedTransportRequired: linkedTransport,
        shareAccessibility,
        accessRequirementsSummary: accessSummary.trim() || undefined,
      });

      const res = await fetch("/api/care-support-transformer/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message,
          participantId,
          assessmentSignals,
          preferences: {
            shareAccessibility,
            shareAccessibilityConfirmed: shareAccessibility,
            linkedTransportRequired: linkedTransport,
            accessRequirementsSummary: accessSummary.trim() || undefined,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not prepare your care plan draft.");
        setLoading(false);
        return;
      }

      setTransformOutput(data as CareSupportTransformOutput);
      setStep("review");
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleConfirmSave() {
    if (!transformOutput) return;
    setConfirming(true);
    setError(null);

    const draft = transformOutput.carePlanDraft;
    const payload = {
      requestType: draft.requestType,
      title: draft.title,
      description: draft.description,
      address: address.trim() || undefined,
      linkedTransportRequired: draft.linkedTransportRequired,
      shareAccessibility: draft.shareAccessibility,
      shareAccessibilityConfirmed:
        draft.shareAccessibility && draft.shareAccessibilityConfirmed,
      accessRequirementsSummary: draft.accessRequirementsSummary,
      tasks: draft.tasks.map((t) => ({
        name: t.name,
        intensity: t.intensity,
      })),
    };

    try {
      const res = await fetch("/api/care/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save your request.");
        setConfirming(false);
        return;
      }

      const id = data.request?.id as string | undefined;
      let redirectTo = `${redirectBase}/bookings`;
      if (id) {
        const submitRes = await fetch(`/api/care/requests/${id}/submit`, {
          method: "POST",
        });
        const submitData = (await submitRes.json()) as {
          redirectTo?: string;
          matchingSkipped?: boolean;
        };
        if (submitRes.ok && submitData.redirectTo) {
          redirectTo = submitData.redirectTo;
        }
      }
      clearLocalDraft(CARE_DRAFT_KEY);
      if (sessionStatus === "authenticated") {
        void fetch(
          `/api/form-drafts?workflowKey=${encodeURIComponent(CARE_DRAFT_KEY)}`,
          { method: "DELETE" },
        );
      }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Could not save your request. Please try again.");
      setConfirming(false);
    }
  }

  const stepDefs = [
    {
      id: "describe",
      title: "Describe your support need",
      description: "One clear question group at a time. Nothing is shared yet.",
      whyAsking:
        "We ask this so support workers understand what you need in your own words.",
    },
    {
      id: "tasks",
      title: "Tasks and location",
      description: "Add the tasks involved and where support should happen.",
      whyAsking: "Tasks help matching and planning without guessing your needs.",
    },
    {
      id: "access",
      title: "Access sharing and transport",
      description:
        "Choose whether to share access notes. Private display settings are never included.",
      whyAsking:
        "Sharing is optional and consent-based. You control what providers can see.",
    },
  ] as const;

  if (step === "review" && transformOutput) {
    return (
      <CarePlanDraftReview
        output={transformOutput}
        onBack={() => {
          setStep("access");
          setError(null);
        }}
        onConfirm={() => void handleConfirmSave()}
        confirming={confirming}
        error={error}
      />
    );
  }

  const fieldErrors = error
    ? [{ id: "care-title", message: error }]
    : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ConsistentHelp
          contextTitle="Care request"
          plainLanguage="Complete each step, save a draft any time, then review before anything is sent to providers. You can sign in again later without losing answers saved as a draft."
          safetyNote="If you are in immediate danger, call 000."
        />
      </div>
      <StepByStepForm
        steps={[...stepDefs]}
        currentStepId={step === "review" ? "access" : step}
        errors={fieldErrors}
        draftMessage={draftMessage}
        draftSaving={draftSaving}
        onSaveDraft={() => void persistDraft(step)}
        onBack={() => {
          if (step === "tasks") setStep("describe");
          if (step === "access") setStep("tasks");
        }}
        onContinue={() => {
          if (step === "describe") {
            if (title.trim().length < 3 || description.trim().length < 1) {
              setError("Add a short title and describe what support you need.");
              document.getElementById("form-error-summary")?.focus();
              return;
            }
            setError(null);
            void persistDraft("tasks");
            setStep("tasks");
            return;
          }
          if (step === "tasks") {
            if (tasks.every((task) => !task.name.trim())) {
              setError("Add at least one support task.");
              document.getElementById("form-error-summary")?.focus();
              return;
            }
            setError(null);
            void persistDraft("access");
            setStep("access");
          }
        }}
        continueLabel={step === "access" ? "Continue to review" : "Continue"}
        hideContinue={step === "access"}
      >
        {preferredProviderName ? (
          <AuthAlert variant="info">
            You are requesting care with a preference for{" "}
            <strong>{preferredProviderName}</strong>.
          </AuthAlert>
        ) : null}

        {step === "describe" ? (
          <div className="space-y-4">
            <fieldset className="space-y-3" disabled={loading}>
              <legend className="text-sm font-medium">What type of support?</legend>
              <SupportTypeChips
                value={requestType}
                onChange={setRequestType}
                disabled={loading}
              />
            </fieldset>
            <AccessibleFormField id="care-title" label="Short title" required>
              <input
                id="care-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={formInputClass}
                placeholder="Example: Morning personal care on Tuesdays"
                disabled={loading}
              />
            </AccessibleFormField>
            <AccessibleFormField
              id="care-description"
              label="Tell us what you need"
              required
              hint="Example format: days, times, and what good support looks like for you."
            >
              <textarea
                id="care-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={formInputClass}
                rows={4}
                disabled={loading}
              />
            </AccessibleFormField>
          </div>
        ) : null}

        {step === "tasks" ? (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Support tasks</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading || tasks.length >= 8}
                  onClick={() => setTasks((prev) => [...prev, emptyTask()])}
                >
                  Add task
                </Button>
              </div>
              {tasks.map((task, index) => (
                <div
                  key={`task-${index}`}
                  className="flex flex-col gap-2 rounded-xl border border-border/50 p-3 sm:flex-row sm:items-end"
                >
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor={`task-name-${index}`}
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Task {index + 1}
                    </label>
                    <input
                      id={`task-name-${index}`}
                      value={task.name}
                      onChange={(e) =>
                        setTasks((prev) =>
                          prev.map((t, i) =>
                            i === index ? { ...t, name: e.target.value } : t,
                          ),
                        )
                      }
                      className={formInputClass}
                      placeholder="Example: Help with shower and dressing"
                      disabled={loading}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={task.intensity === "high"}
                      onChange={(e) =>
                        setTasks((prev) =>
                          prev.map((t, i) =>
                            i === index
                              ? {
                                  ...t,
                                  intensity: e.target.checked
                                    ? "high"
                                    : "standard",
                                }
                              : t,
                          ),
                        )
                      }
                      disabled={loading}
                    />
                    Higher intensity
                  </label>
                </div>
              ))}
            </div>
            <AccessibleFormField id="care-address" label="Suburb or address (optional)">
              <input
                id="care-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={formInputClass}
                disabled={loading}
              />
            </AccessibleFormField>
          </div>
        ) : null}

        {step === "access" ? (
          <form
            className="space-y-4"
            onSubmit={(event) => void handleContinueToReview(event)}
          >
            <FormErrorSummary errors={fieldErrors} />
            <div className="space-y-3 rounded-xl border border-dashed border-border/70 bg-muted/20 p-4">
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={shareAccessibility}
                  onChange={(e) => setShareAccessibility(e.target.checked)}
                  disabled={loading}
                  className="mt-1"
                />
                <span>
                  Share access requirements with an assigned provider after I
                  confirm (consent required). Interface preferences are never shared
                  here.
                </span>
              </label>
              {shareAccessibility ? (
                <AccessibleFormField
                  id="care-access"
                  label="Access needs summary"
                  hint="Minimum necessary functional detail only — not diagnoses."
                >
                  <textarea
                    id="care-access"
                    value={accessSummary}
                    onChange={(e) => setAccessSummary(e.target.value)}
                    className={formInputClass}
                    rows={2}
                    disabled={loading}
                  />
                </AccessibleFormField>
              ) : null}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={linkedTransport}
                  onChange={(e) => setLinkedTransport(e.target.checked)}
                  disabled={loading}
                />
                I may also need transport linked to this support
              </label>
            </div>
            <Button
              type="submit"
              variant="default"
              size="lg"
              disabled={loading}
              loading={loading}
            >
              {loading ? "Preparing your draft…" : "Review before submit"}
            </Button>
          </form>
        ) : null}
      </StepByStepForm>
    </div>
  );
}
