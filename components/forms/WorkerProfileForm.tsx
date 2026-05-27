"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export interface WorkerProfileFormData {
  displayName: string;
  profileSummary?: string | null;
  serviceTypes: string[];
  serviceRegions: string[];
  specialisations: string[];
  languages: string[];
  qualificationsSummary?: string | null;
}

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinList(items: string[]): string {
  return items.join(", ");
}

export function WorkerProfileForm({
  initial,
  onSuccessRedirect,
}: {
  initial: WorkerProfileFormData;
  onSuccessRedirect?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const res = await fetch("/api/worker-profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        setLoading(false);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Could not save profile");
          return;
        }
        setStatus("Profile saved.");
        if (onSuccessRedirect) {
          router.push(onSuccessRedirect);
        } else {
          router.refresh();
        }
      }}
    >
      <AccessibleFormField id="displayName" label="Display name" required>
        <input
          id="displayName"
          className={formInputClass}
          value={form.displayName}
          onChange={(e) =>
            setForm({ ...form, displayName: e.target.value })
          }
          required
        />
      </AccessibleFormField>

      <AccessibleFormField id="profileSummary" label="About you">
        <textarea
          id="profileSummary"
          className={formInputClass}
          rows={4}
          value={form.profileSummary ?? ""}
          onChange={(e) =>
            setForm({ ...form, profileSummary: e.target.value })
          }
        />
      </AccessibleFormField>

      <AccessibleFormField
        id="qualificationsSummary"
        label="Qualifications"
      >
        <textarea
          id="qualificationsSummary"
          className={formInputClass}
          rows={3}
          value={form.qualificationsSummary ?? ""}
          onChange={(e) =>
            setForm({ ...form, qualificationsSummary: e.target.value })
          }
        />
      </AccessibleFormField>

      <AccessibleFormField
        id="serviceTypes"
        label="Service types"
        hint="Comma-separated, e.g. personal_care, community_access"
      >
        <input
          id="serviceTypes"
          className={formInputClass}
          value={joinList(form.serviceTypes)}
          onChange={(e) =>
            setForm({ ...form, serviceTypes: parseList(e.target.value) })
          }
        />
      </AccessibleFormField>

      <AccessibleFormField
        id="serviceRegions"
        label="Service regions"
        hint="Comma-separated areas you work in"
      >
        <input
          id="serviceRegions"
          className={formInputClass}
          value={joinList(form.serviceRegions)}
          onChange={(e) =>
            setForm({ ...form, serviceRegions: parseList(e.target.value) })
          }
        />
      </AccessibleFormField>

      <AccessibleFormField id="languages" label="Languages">
        <input
          id="languages"
          className={formInputClass}
          value={joinList(form.languages)}
          onChange={(e) =>
            setForm({ ...form, languages: parseList(e.target.value) })
          }
        />
      </AccessibleFormField>

      <AccessibleFormField id="specialisations" label="Specialisations">
        <input
          id="specialisations"
          className={formInputClass}
          value={joinList(form.specialisations)}
          onChange={(e) =>
            setForm({ ...form, specialisations: parseList(e.target.value) })
          }
        />
      </AccessibleFormField>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {status && <p className="text-green-700 text-sm">{status}</p>}
      <Button type="submit" variant="default" loading={loading}>
        Save profile
      </Button>
    </form>
  );
}
