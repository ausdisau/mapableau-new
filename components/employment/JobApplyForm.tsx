"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

type JobApplyFormProps = {
  jobId: string;
  jobTitle: string;
};

export function JobApplyForm({ jobId, jobTitle }: JobApplyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const fd = new FormData(e.currentTarget);
        const shareAdj = fd.get("shareAdjustments") === "on";
        const res = await fetch("/api/job-applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId,
            applicantSummary: fd.get("summary"),
            coverLetter: fd.get("coverLetter"),
            reasonableAdjustmentRequest: fd.get("adjustments") || undefined,
            shareAdjustments: shareAdj,
            shareAdjustmentsConfirmed: shareAdj,
            transportSupportNeeded: fd.get("transportSupport") === "on",
            careSupportNeeded: fd.get("careSupport") === "on",
          }),
        });
        const d = await res.json();
        if (!res.ok) {
          setLoading(false);
          setError(d.error ?? "Could not apply");
          return;
        }
        const submit = await fetch(
          `/api/job-applications/${d.application.id}/submit`,
          { method: "POST" },
        );
        setLoading(false);
        if (!submit.ok) {
          router.push(`/dashboard/jobs/applications`);
          return;
        }
        router.push(`/dashboard/jobs/applications`);
      }}
    >
      <h2 className="font-heading text-xl font-semibold">Apply for {jobTitle}</h2>
      {error ? (
        <div role="alert" className="rounded-lg border border-destructive p-3 text-sm">
          {error}
        </div>
      ) : null}
      <label className="block text-sm font-medium">
        About you
        <textarea name="summary" className={`${formInputClass} min-h-[80px]`} />
      </label>
      <label className="block text-sm font-medium">
        Cover letter
        <textarea name="coverLetter" className={`${formInputClass} min-h-[100px]`} />
      </label>
      <label className="block text-sm font-medium">
        Reasonable adjustments (optional)
        <textarea name="adjustments" className={`${formInputClass} min-h-[80px]`} />
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="shareAdjustments" className="mt-1 size-5" />
        I agree to share adjustment details with this employer
      </label>
      <fieldset className="space-y-2 rounded-lg border p-4">
        <legend className="px-1 text-sm font-semibold">Support for interviews</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="transportSupport" className="size-5" />
          I may need help with transport
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="careSupport" className="size-5" />
          I may need employment support sessions
        </label>
      </fieldset>
      <Button type="submit" variant="default" size="lg" disabled={loading}>
        Submit application
      </Button>
    </form>
  );
}
