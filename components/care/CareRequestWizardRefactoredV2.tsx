"use client";

/**
 * CareRequestWizard Refactored (v2) - Full Accessibility Integration
 *
 * This version demonstrates:
 * - Screen reader announcements (assertive for errors, polite for success)
 * - Motion preferences (respects prefers-reduced-motion)
 * - Focus management (focus restoration, automatic focus to errors)
 * - Focus ring visibility (custom focus styles)
 *
 * This is an EXAMPLE/REFERENCE implementation showing the full pattern.
 * The main component (CareRequestWizard.tsx) uses these hooks incrementally.
 */

import { useRouter } from "next/navigation";
import { useMemo, useState, useRef, useEffect } from "react";

import { AuthAlert } from "@/components/auth/AuthAlert";
import { CarePlanDraftReview } from "@/components/care/CarePlanDraftReview";
import {
  SupportTypeChips,
  type CareRequestTypeValue,
} from "@/components/care/SupportTypeChips";
import {
  ConsentScopeCheckbox,
  type ConsentScopeOption,
} from "@/components/consent/ConsentScopeCheckbox";
import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { SensitiveDataBanner } from "@/components/forms/SensitiveDataBanner";
import { Button } from "@/components/ui/button";
import {
  composeCareSupportMessage,
  type CareIntakeTaskRow,
} from "@/lib/care/compose-care-message";
import type { CareSupportTransformOutput } from "@/server/agents/care/types";
import {
  useAccessibilityAnnouncement,
  useMotionPreferencesSafe,
  useFocusRing,
  useFocusManager,
} from "@/lib/accessibility";

const CARE_CONSENT_SCOPES: ConsentScopeOption[] = [
  {
    id: "care_draft_processing",
    label: "MapAble may process this support description to prepare my draft plan",
    description: "Used only to generate and show your draft for review.",
  },
  {
    id: "no_sensitive_upload",
    label:
      "I confirm I have not pasted NDIS plan documents or clinical records into this form",
    description: "Use a secure MapAble pathway if those records are required.",
  },
];

function newSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}`;
}

function emptyTask(): CareIntakeTaskRow {
  return { name: "", intensity: "standard" };
}

function focusField(id: string) {
  const el = document.getElementById(id);
  if (el instanceof HTMLElement) {
    el.focus();
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

/**
 * CareRequestWizardRefactoredV2
 *
 * Full accessibility integration example:
 * - Uses all accessibility hooks together
 * - Shows motion-safe transitions
 * - Demonstrates focus management
 * - Shows focus ring styling
 */
export function CareRequestWizardRefactoredV2({
  redirectBase = "/care",
  participantId,
  preferredOrganisationId,
  preferredProviderName,
}: {
  redirectBase?: string;
  participantId?: string;
  preferredOrganisationId?: string;
  preferredProviderName?: string;
}) {
  const router = useRouter();
  const sessionId = useMemo(() => newSessionId(), []);

  // Accessibility hooks
  const { announcerRef, announce } = useAccessibilityAnnouncement();
  const { transitionDuration } = useMotionPreferencesSafe();
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Focus management: restore focus to submit button after async operations
  const focusManager = useFocusManager(submitButtonRef, {
    restoreFocus: true,
  });

  // Form state
  const [step, setStep] = useState<"describe" | "review">("describe");
  const [requestType, setRequestType] =
    useState<CareRequestTypeValue>("personal_care");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [tasks, setTasks] = useState<CareIntakeTaskRow[]>([
    { name: "", intensity: "standard" },
  ]);
  const [shareAccessibility, setShareAccessibility] = useState(false);
  const [accessSummary, setAccessSummary] = useState("");
  const [linkedTransport, setLinkedTransport] = useState(false);
  const [consentIds, setConsentIds] = useState<string[]>([]);
  const [consentError, setConsentError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transformOutput, setTransformOutput] =
    useState<CareSupportTransformOutput | null>(null);

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
    setConsentError(null);

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (trimmedTitle.length < 3) {
      const msg = "Please add a short title (at least 3 characters).";
      setError(msg);
      announce(msg, { priority: "assertive" });
      queueMicrotask(() => focusField("care-title"));
      return;
    }

    if (trimmedDescription.length < 1) {
      const msg = "Please describe what support you need.";
      setError(msg);
      announce(msg, { priority: "assertive" });
      queueMicrotask(() => focusField("care-description"));
      return;
    }

    const taskRows = tasks
      .map((t) => ({ ...t, name: t.name.trim() }))
      .filter((t) => t.name.length > 0);

    if (taskRows.length === 0) {
      const msg =
        "Add at least one support task, or describe tasks in your details.";
      setError(msg);
      announce(msg, { priority: "assertive" });
      queueMicrotask(() => focusField("task-name-0"));
      return;
    }

    if (!consentIds.includes("care_draft_processing")) {
      const msg =
        "Confirm MapAble may process this description to prepare your draft.";
      setConsentError(msg);
      announce(msg, { priority: "assertive" });
      queueMicrotask(() => focusField("care-consent-legend"));
      return;
    }

    if (!consentIds.includes("no_sensitive_upload")) {
      const msg =
        "Confirm you have not pasted NDIS plan or clinical records into this form.";
      setConsentError(msg);
      announce(msg, { priority: "assertive" });
      queueMicrotask(() => focusField("care-consent-legend"));
      return;
    }

    if (shareAccessibility && accessSummary.trim().length < 3) {
      const msg = "Add a brief access needs summary, or untick sharing.";
      setError(msg);
      announce(msg, { priority: "assertive" });
      queueMicrotask(() => focusField("care-access"));
      return;
    }

    setLoading(true);
    announce("Preparing your draft… please wait.", { priority: "polite" });

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
          consentScopes: consentIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Could not prepare your care plan draft.";
        setError(msg);
        announce(msg, { priority: "assertive" });
        setLoading(false);
        return;
      }

      setTransformOutput(data as CareSupportTransformOutput);
      announce(
        "Draft prepared. Review your draft before confirming. This will take you to the next step.",
        { priority: "polite" }
      );

      // Motion-safe transition to review step
      setTimeout(() => {
        setStep("review");
        setLoading(false);
      }, transitionDuration === "0ms" ? 0 : 300);
    } catch {
      const msg = "Something went wrong. Please try again.";
      setError(msg);
      announce(msg, { priority: "assertive" });
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

    announce("Saving your request… please wait.", { priority: "polite" });

    try {
      const res = await fetch("/api/care/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Could not save your request.";
        setError(msg);
        announce(msg, { priority: "assertive" });
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

      announce(
        "Your request has been saved successfully. Redirecting you now.",
        { priority: "polite" }
      );

      // Motion-safe redirect delay
      setTimeout(() => {
        router.push(redirectTo);
        router.refresh();
      }, transitionDuration === "0ms" ? 0 : 500);
    } catch {
      const msg = "Could not save your request. Please try again.";
      setError(msg);
      announce(msg, { priority: "assertive" });
      setConfirming(false);
    }
  }

  if (step === "review" && transformOutput) {
    return (
      <CarePlanDraftReview
        output={transformOutput}
        onBack={() => {
          setStep("describe");
          setError(null);
          announce("Returned to form. You can edit your entries.", {
            priority: "polite",
          });
        }}
        onConfirm={() => void handleConfirmSave()}
        confirming={confirming}
        error={error}
      />
    );
  }

  return (
    <form
      ref={formRef}
      className="space-y-6"
      onSubmit={(e) => void handleContinueToReview(e)}
      style={{ transitionDuration }}
    >
      {/* Screen reader announcer */}
      <div ref={announcerRef} className="sr-only" />

      {preferredProviderName ? (
        <AuthAlert variant="info">
          You are requesting care with a preference for{" "}
          <strong>{preferredProviderName}</strong>. MapAble will use this when
          matching and assigning your request
          {preferredOrganisationId ? " to a verified provider on the platform" : ""}
          .
        </AuthAlert>
      ) : null}

      <AuthAlert variant="info">
        Describe what you need in everyday language. You will review a draft
        plan before anything is shared with providers. Pricing and worker
        matching come after you confirm — no surprises at this step.
      </AuthAlert>

      <SensitiveDataBanner id="care-sensitive-data-banner" />

      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

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
          placeholder="e.g. Morning personal care on Tuesdays"
          required
          disabled={loading}
          style={{ transitionDuration }}
        />
      </AccessibleFormField>

      <AccessibleFormField
        id="care-description"
        label="Tell us what you need"
        required
        hint="Include timing, location, and anything important for the support worker. Do not paste NDIS plan PDFs or clinical records."
      >
        <textarea
          id="care-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={formInputClass}
          rows={4}
          required
          disabled={loading}
          aria-describedby="care-sensitive-data-banner"
          style={{ transitionDuration }}
        />
      </AccessibleFormField>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Support tasks</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || tasks.length >= 8}
            onClick={() => {
              setTasks((prev) => [...prev, emptyTask()]);
              announce(`Task ${tasks.length + 1} added. Enter task details.`, {
                priority: "polite",
              });
            }}
            style={{ transitionDuration }}
          >
            Add task
          </Button>
        </div>
        {tasks.map((task, index) => (
          <div
            key={`task-${index}`}
            className="flex flex-col gap-2 rounded-xl border border-border/50 p-3 sm:flex-row sm:items-end"
            style={{ transitionDuration }}
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
                      i === index ? { ...t, name: e.target.value } : t
                    )
                  )
                }
                className={formInputClass}
                placeholder="e.g. Help with shower and dressing"
                disabled={loading}
                style={{ transitionDuration }}
              />
            </div>
            <div className="flex shrink-0 items-center gap-2">
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
                              intensity: e.target.checked ? "high" : "standard",
                            }
                          : t
                      )
                    )
                  }
                  disabled={loading}
                  style={{ transitionDuration }}
                />
                Higher intensity
              </label>
              {tasks.length > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => {
                    setTasks((prev) => prev.filter((_, i) => i !== index));
                    announce(`Task ${index + 1} removed.`, {
                      priority: "polite",
                    });
                  }}
                  style={{ transitionDuration }}
                >
                  Remove
                </Button>
              ) : null}
            </div>
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
          style={{ transitionDuration }}
        />
      </AccessibleFormField>

      <div
        className="space-y-3 rounded-xl border border-dashed border-border/70 bg-muted/20 p-4"
        style={{ transitionDuration }}
      >
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={shareAccessibility}
            onChange={(e) => {
              setShareAccessibility(e.target.checked);
              if (e.target.checked) {
                announce(
                  "Accessibility notes section shown. Add a brief summary.",
                  { priority: "polite" }
                );
              }
            }}
            disabled={loading}
            className="mt-1"
            style={{ transitionDuration }}
          />
          <span>
            Share accessibility or access notes with an assigned provider (only
            after you confirm — requires consent)
          </span>
        </label>
        {shareAccessibility ? (
          <AccessibleFormField
            id="care-access"
            label="Access needs summary"
            hint="Minimum necessary detail only."
          >
            <textarea
              id="care-access"
              value={accessSummary}
              onChange={(e) => setAccessSummary(e.target.value)}
              className={formInputClass}
              rows={2}
              disabled={loading}
              style={{ transitionDuration }}
            />
          </AccessibleFormField>
        ) : null}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={linkedTransport}
            onChange={(e) => {
              setLinkedTransport(e.target.checked);
              announce(
                e.target.checked
                  ? "Transport linking enabled. This will be arranged separately."
                  : "Transport linking disabled.",
                { priority: "polite" }
              );
            }}
            disabled={loading}
            style={{ transitionDuration }}
          />
          I may also need transport linked to this support
        </label>
      </div>

      <div id="care-consent-legend" tabIndex={-1}>
        <ConsentScopeCheckbox
          scopes={CARE_CONSENT_SCOPES}
          checkedIds={consentIds}
          onChange={(ids) => {
            setConsentIds(ids);
            setConsentError(null);
          }}
          requiredScopeIds={["care_draft_processing", "no_sensitive_upload"]}
          error={consentError ?? undefined}
          legend="Consent before preparing your draft"
        />
      </div>

      <Button
        ref={submitButtonRef}
        type="submit"
        variant="default"
        size="lg"
        className="w-full sm:w-auto"
        disabled={loading}
        loading={loading}
        style={{ transitionDuration }}
      >
        {loading ? "Preparing your draft…" : "Continue to review"}
      </Button>
    </form>
  );
}
