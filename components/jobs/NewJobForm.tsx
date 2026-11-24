"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import {
  jobSkillsSchema,
  maxJobSkillLength,
  maxJobSkills,
} from "@/lib/validation/jobs";

function skillsFromLines(
  value: FormDataEntryValue | null,
  isEssential: boolean,
) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((label) => ({ label, isEssential }));
}

export function NewJobForm({
  organisations,
  skillsEnabled,
}: {
  organisations: { id: string; name: string }[];
  skillsEnabled: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const form = event.currentTarget;
    const fd = new FormData(form);
    const skills = jobSkillsSchema.safeParse([
      ...skillsFromLines(fd.get("essentialSkills"), true),
      ...skillsFromLines(fd.get("additionalSkills"), false),
    ]);
    if (!skills.success) {
      setError(skills.error.issues[0].message);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employerOrganisationId: fd.get("employerOrganisationId"),
          title: fd.get("title"),
          description: fd.get("description"),
          employmentType: fd.get("employmentType"),
          location: fd.get("location"),
          remoteAllowed: fd.get("remote") === "on",
          flexibleHours: fd.get("flexible") === "on",
          adjustmentOpennessStatement: fd.get("adjustments"),
          ...(skillsEnabled
            ? {
                skills: skills.data,
                applicationInstructions: fd.get("applicationInstructions"),
              }
            : {}),
        }),
      });
      if (!res.ok) {
        setError(
          res.status === 403
            ? "Your access to this draft has changed. Check your organisation or contact MapAble."
            : "Could not save the draft. Check the fields and try again.",
        );
        return;
      }
      const { job } = await res.json();
      router.push(`/employer/jobs/${encodeURIComponent(job.id)}`);
    } catch {
      setError(
        "We couldn’t confirm the save. Check your drafts before trying again. Your entries are still here.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="max-w-2xl space-y-4" onSubmit={saveDraft}>
      <h1 className="font-heading text-2xl font-bold">
        New job listing (draft)
      </h1>
      <label htmlFor="employerOrganisationId" className="text-sm font-medium">
        Employer organisation
      </label>
      <select
        id="employerOrganisationId"
        name="employerOrganisationId"
        className={formInputClass}
        required
        defaultValue={organisations.length === 1 ? organisations[0].id : ""}
      >
        <option value="" disabled>
          Choose an organisation
        </option>
        {organisations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
      <label htmlFor="title" className="text-sm font-medium">
        Title
      </label>
      <input
        id="title"
        name="title"
        className={formInputClass}
        minLength={3}
        maxLength={200}
        required
      />
      <label htmlFor="description" className="text-sm font-medium">
        Description
      </label>
      <textarea
        id="description"
        name="description"
        className={formInputClass}
        rows={5}
        minLength={10}
        required
      />
      {skillsEnabled && (
        <fieldset
          className="space-y-3 rounded-lg border p-4"
          aria-describedby="skill-hint"
        >
          <legend className="px-1 font-semibold">
            Skills for this role (optional)
          </legend>
          <p id="skill-hint" className="text-sm text-muted-foreground">
            Describe tasks in plain language. Enter one skill per line, up to{" "}
            {maxJobSkills} across both groups and {maxJobSkillLength} characters
            per skill.
          </p>
          <label
            htmlFor="essentialSkills"
            className="block text-sm font-medium"
          >
            Skills needed at the start
          </label>
          <textarea
            id="essentialSkills"
            name="essentialSkills"
            aria-describedby="skill-hint"
            className={formInputClass}
            rows={3}
          />
          <label
            htmlFor="additionalSkills"
            className="block text-sm font-medium"
          >
            Additional skills (optional for applicants)
          </label>
          <textarea
            id="additionalSkills"
            name="additionalSkills"
            aria-describedby="skill-hint"
            className={formInputClass}
            rows={3}
          />
          <label
            htmlFor="applicationInstructions"
            className="block text-sm font-medium"
          >
            How can applicants demonstrate their skills?
          </label>
          <p id="evidence-hint" className="text-sm text-muted-foreground">
            List the formats you accept, such as a written example, a work
            sample or an AAC-supported conversation.
          </p>
          <textarea
            id="applicationInstructions"
            name="applicationInstructions"
            aria-describedby="evidence-hint"
            className={formInputClass}
            rows={3}
          />
        </fieldset>
      )}
      <label htmlFor="employmentType" className="text-sm font-medium">
        Employment type
      </label>
      <select
        id="employmentType"
        name="employmentType"
        className={formInputClass}
      >
        <option value="part_time">Part time</option>
        <option value="full_time">Full time</option>
        <option value="casual">Casual</option>
      </select>
      <label htmlFor="location" className="text-sm font-medium">
        Location
      </label>
      <input id="location" name="location" className={formInputClass} />
      <label htmlFor="adjustments" className="text-sm font-medium">
        Adjustment openness
      </label>
      <textarea
        id="adjustments"
        name="adjustments"
        className={formInputClass}
        rows={2}
      />
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="remote" /> Remote allowed
      </label>
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="flexible" /> Flexible hours
      </label>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" variant="default" size="default" loading={loading}>
        Save draft
      </Button>
    </form>
  );
}
