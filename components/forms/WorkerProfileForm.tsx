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

type ListField =
  | "serviceTypes"
  | "serviceRegions"
  | "languages"
  | "specialisations";

function listDraftsFromData(data: WorkerProfileFormData) {
  return {
    serviceTypes: joinList(data.serviceTypes),
    serviceRegions: joinList(data.serviceRegions),
    languages: joinList(data.languages),
    specialisations: joinList(data.specialisations),
  };
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
  const [listDrafts, setListDrafts] = useState(() => listDraftsFromData(initial));
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const commitListField = (field: ListField) => {
    setForm((prev) => ({
      ...prev,
      [field]: parseList(listDrafts[field]),
    }));
  };

  const commitAllListFields = () => {
    setForm((prev) => ({
      ...prev,
      serviceTypes: parseList(listDrafts.serviceTypes),
      serviceRegions: parseList(listDrafts.serviceRegions),
      languages: parseList(listDrafts.languages),
      specialisations: parseList(listDrafts.specialisations),
    }));
  };

  const listInputProps = (field: ListField, id: string) => ({
    id,
    className: formInputClass,
    value: listDrafts[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setListDrafts((prev) => ({ ...prev, [field]: e.target.value }));
    },
    onBlur: () => commitListField(field),
  });

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        commitAllListFields();
        const payload = {
          ...form,
          serviceTypes: parseList(listDrafts.serviceTypes),
          serviceRegions: parseList(listDrafts.serviceRegions),
          languages: parseList(listDrafts.languages),
          specialisations: parseList(listDrafts.specialisations),
        };
        const res = await fetch("/api/worker-profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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
        <input {...listInputProps("serviceTypes", "serviceTypes")} />
      </AccessibleFormField>

      <AccessibleFormField
        id="serviceRegions"
        label="Service regions"
        hint="Comma-separated areas you work in"
      >
        <input {...listInputProps("serviceRegions", "serviceRegions")} />
      </AccessibleFormField>

      <AccessibleFormField id="languages" label="Languages">
        <input {...listInputProps("languages", "languages")} />
      </AccessibleFormField>

      <AccessibleFormField id="specialisations" label="Specialisations">
        <input {...listInputProps("specialisations", "specialisations")} />
      </AccessibleFormField>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {status && <p className="text-green-700 text-sm">{status}</p>}
      <Button type="submit" variant="default" size="default" loading={loading}>
        Save profile
      </Button>
    </form>
  );
}
