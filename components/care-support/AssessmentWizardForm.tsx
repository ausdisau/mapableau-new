"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export function AssessmentWizardForm({ assessmentId }: { assessmentId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  async function saveDraft(sections: Record<string, unknown>) {
    if (assessmentId) {
      const res = await fetch(`/api/care-support/assessments/${assessmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionsJson: sections }),
      });
      if (!res.ok) throw new Error("Save failed");
      return assessmentId;
    }
    const res = await fetch("/api/care-support/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionsJson: sections }),
    });
    if (!res.ok) throw new Error("Create failed");
    const d = await res.json();
    return d.assessment.id as string;
  }

  return (
    <form
      className="max-w-2xl space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const fd = new FormData(e.currentTarget);
        const goals = (fd.get("goals") as string)
          .split("\n")
          .map((g) => g.trim())
          .filter(Boolean);
        const sections = {
          dailyLiving: { notes: fd.get("dailyLiving") || "" },
          community: { notes: fd.get("community") || "" },
          employment: { notes: fd.get("employment") || "" },
          risks: { notes: fd.get("risks") || "" },
          communication: { notes: fd.get("communication") || "" },
          goals,
          accessNeedsSummary: fd.get("accessNeedsSummary") || "",
          communicationNotes: fd.get("communicationNotes") || "",
        };

        try {
          const id = await saveDraft(sections);
          if (step < 3) {
            setStep(step + 1);
            setLoading(false);
            router.replace(`/care/support/assessment?id=${id}`);
            return;
          }
          const submitRes = await fetch(`/api/care-support/assessments/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "submitted" }),
          });
          if (!submitRes.ok) throw new Error("Submit failed");
          router.push("/care/support");
        } catch {
          setError("Could not save assessment. Please try again.");
        } finally {
          setLoading(false);
        }
      }}
    >
      {error ? (
        <div role="alert" className="rounded-lg border border-destructive p-3 text-sm">
          {error}
        </div>
      ) : null}

      <p className="text-sm text-muted-foreground" aria-live="polite">
        Step {step} of 3
      </p>

      {step === 1 ? (
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold">Daily living and community</legend>
          <label htmlFor="dailyLiving" className="text-sm font-medium">
            Daily living needs
          </label>
          <textarea id="dailyLiving" name="dailyLiving" rows={3} className={formInputClass} />
          <label htmlFor="community" className="text-sm font-medium">
            Community participation
          </label>
          <textarea id="community" name="community" rows={3} className={formInputClass} />
        </fieldset>
      ) : null}

      {step === 2 ? (
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold">Goals and communication</legend>
          <label htmlFor="goals" className="text-sm font-medium">
            Goals (one per line)
          </label>
          <textarea id="goals" name="goals" rows={4} className={formInputClass} />
          <label htmlFor="communication" className="text-sm font-medium">
            Communication preferences
          </label>
          <textarea id="communication" name="communication" rows={2} className={formInputClass} />
          <label htmlFor="communicationNotes" className="text-sm font-medium">
            Additional communication notes
          </label>
          <textarea
            id="communicationNotes"
            name="communicationNotes"
            rows={2}
            className={formInputClass}
          />
        </fieldset>
      ) : null}

      {step === 3 ? (
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold">Risks and access</legend>
          <label htmlFor="employment" className="text-sm font-medium">
            Employment / skill building
          </label>
          <textarea id="employment" name="employment" rows={2} className={formInputClass} />
          <label htmlFor="risks" className="text-sm font-medium">
            Risks or safeguards
          </label>
          <textarea id="risks" name="risks" rows={2} className={formInputClass} />
          <label htmlFor="accessNeedsSummary" className="text-sm font-medium">
            Access needs summary
          </label>
          <textarea
            id="accessNeedsSummary"
            name="accessNeedsSummary"
            rows={3}
            className={formInputClass}
          />
        </fieldset>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {step > 1 ? (
          <Button type="button" variant="outline" size="default" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        ) : null}
        <Button type="submit" variant="default" size="default" disabled={loading}>
          {loading ? "Saving…" : step < 3 ? "Save and continue" : "Submit assessment"}
        </Button>
      </div>
    </form>
  );
}
