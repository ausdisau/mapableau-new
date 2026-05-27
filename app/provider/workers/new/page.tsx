"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

type Membership = {
  providerId: string;
  providerName: string;
  organisationId: string;
};

export default function NewWorkerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [error, setError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    fetch("/api/provider-admin/memberships")
      .then((r) => r.json())
      .then((data) => {
        const list = (data.memberships ?? [])
          .filter(
            (m: { providerId?: string; organisationId?: string }) =>
              m.providerId && m.organisationId
          )
          .map(
            (m: {
              providerId: string;
              providerName: string;
              organisationId: string;
            }) => ({
              providerId: m.providerId,
              providerName: m.providerName,
              organisationId: m.organisationId,
            })
          ) as Membership[];
        setMemberships(list);
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
        const providerId =
          (fd.get("providerId") as string) || memberships[0]?.providerId || "";
        if (!providerId) {
          setError("No provider selected. You need provider admin access.");
          setLoading(false);
          return;
        }

        const workerEmail = (fd.get("workerEmail") as string).trim();
        const payload: Record<string, string> = {
          displayName: (fd.get("displayName") as string).trim(),
        };
        if (fd.get("profileSummary")) {
          payload.profileSummary = fd.get("profileSummary") as string;
        }
        if (workerEmail) {
          payload.email = workerEmail;
        } else {
          const userId = (fd.get("userId") as string).trim();
          if (!userId) {
            setError("Provide worker email or user ID.");
            setLoading(false);
            return;
          }
          payload.userId = userId;
        }

        const res = await fetch(
          `/api/providers/${providerId}/workers/affiliate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        setLoading(false);
        if (res.ok) {
          const d = await res.json();
          router.push(`/provider/workers/${d.profile.id}`);
        } else {
          const d = await res.json();
          setError(d.error ?? "Could not affiliate worker");
        }
      }}
    >
      <h1 className="font-heading text-2xl font-bold">Affiliate worker</h1>
      <p className="text-sm text-muted-foreground">
        Link an existing MapAble user to your provider organisation.
      </p>
      {memberships.length > 1 && (
        <>
          <label htmlFor="providerId" className="text-sm font-medium">
            Provider
          </label>
          <select
            id="providerId"
            name="providerId"
            className={formInputClass}
            required
          >
            {memberships.map((m) => (
              <option key={m.providerId} value={m.providerId}>
                {m.providerName}
              </option>
            ))}
          </select>
        </>
      )}
      {memberships.length === 1 && (
        <input type="hidden" name="providerId" value={memberships[0].providerId} />
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
        Affiliate worker
      </Button>

      <hr className="border-border my-8" />

      <h2 className="font-heading text-lg font-semibold">Invite by email</h2>
      <p className="text-sm text-muted-foreground">
        Send an invitation link when the worker is not registered yet or should
        confirm affiliation.
      </p>
      <label htmlFor="inviteEmail" className="text-sm font-medium">
        Email
      </label>
      <input
        id="inviteEmail"
        type="email"
        className={formInputClass}
        value={inviteEmail}
        onChange={(e) => setInviteEmail(e.target.value)}
      />
      <Button
        type="button"
        variant="outline"
        size="default"
        loading={inviteLoading}
        onClick={async () => {
          const providerId =
            memberships[0]?.providerId ??
            (
              document.querySelector(
                'select[name="providerId"]'
              ) as HTMLSelectElement | null
            )?.value;
          if (!providerId || !inviteEmail.trim()) {
            setError("Select a provider and enter an email for the invite.");
            return;
          }
          setInviteLoading(true);
          setError("");
          setInviteUrl("");
          const res = await fetch(
            `/api/providers/${providerId}/workers/invites`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: inviteEmail.trim() }),
            }
          );
          const data = await res.json();
          setInviteLoading(false);
          if (!res.ok) {
            setError(data.error ?? "Could not create invitation");
            return;
          }
          setInviteUrl(data.inviteUrl ?? "");
        }}
      >
        Create invitation
      </Button>
      {inviteUrl && (
        <p className="text-sm break-all rounded-lg border p-3 bg-muted/30">
          Share this link:{" "}
          <a href={inviteUrl} className="underline">
            {inviteUrl}
          </a>
        </p>
      )}
    </form>
  );
}
