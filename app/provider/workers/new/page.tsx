"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export default function NewWorkerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [orgIds, setOrgIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/provider-admin/memberships")
      .then((r) => r.json())
      .then((data) => {
        const ids = (data.memberships ?? [])
          .map((m: { organisationId?: string }) => m.organisationId)
          .filter(Boolean) as string[];
        setOrgIds(ids);
      })
      .catch(() => {});
  }, []);

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const fd = new FormData(e.currentTarget);
        const organisationId =
          (fd.get("organisationId") as string) || orgIds[0] || "";
        const workerEmail = (fd.get("workerEmail") as string).trim();

        let userId = fd.get("userId") as string;
        if (workerEmail) {
          const lookup = await fetch(
            `/api/users/lookup?email=${encodeURIComponent(workerEmail)}`
          );
          const lookupData = await lookup.json();
          if (!lookup.ok || !lookupData.userId) {
            setError(
              lookupData.error ??
                "No user found with that email. They must register first."
            );
            setLoading(false);
            return;
          }
          userId = lookupData.userId;
        }

        const res = await fetch("/api/workers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organisationId,
            userId,
            displayName: fd.get("displayName"),
            profileSummary: fd.get("profileSummary"),
          }),
        });
        setLoading(false);
        if (res.ok) {
          const d = await res.json();
          router.push(`/provider/workers/${d.profile.id}`);
        } else {
          const d = await res.json();
          setError(d.error ?? "Could not create worker profile");
        }
      }}
    >
      <h1 className="font-heading text-2xl font-bold">Add worker profile</h1>
      {orgIds.length > 1 && (
        <>
          <label htmlFor="organisationId" className="text-sm font-medium">
            Organisation ID
          </label>
          <select
            id="organisationId"
            name="organisationId"
            className={formInputClass}
            required
          >
            {orgIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </>
      )}
      {orgIds.length === 1 && (
        <input type="hidden" name="organisationId" value={orgIds[0]} />
      )}
      <label htmlFor="workerEmail" className="text-sm font-medium">
        Worker email
      </label>
      <input
        id="workerEmail"
        name="workerEmail"
        type="email"
        className={formInputClass}
        placeholder="person@example.com"
      />
      <p className="text-xs text-muted-foreground">
        Or provide a user ID if you already have it:
      </p>
      <label htmlFor="userId" className="text-sm font-medium">
        User ID (optional if email set)
      </label>
      <input id="userId" name="userId" className={formInputClass} />
      <label htmlFor="displayName" className="text-sm font-medium">
        Display name
      </label>
      <input id="displayName" name="displayName" className={formInputClass} required />
      <label htmlFor="profileSummary" className="text-sm font-medium">
        Summary
      </label>
      <textarea
        id="profileSummary"
        name="profileSummary"
        className={formInputClass}
        rows={3}
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <Button type="submit" variant="default" size="default" loading={loading}>
        Create
      </Button>
    </form>
  );
}
