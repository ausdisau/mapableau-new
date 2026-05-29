"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type InviteMeta = {
  status: string;
  expiresAt: string;
  provider: { id: string; name: string };
  organisation: { id: string; name: string };
  email: string;
};

export default function WorkerInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [meta, setMeta] = useState<InviteMeta | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/worker-invites/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setMeta(data);
      })
      .catch(() => setError("Could not load invitation"));
  }, [token]);

  if (error && !meta) {
    return (
      <p className="text-destructive text-sm">{error}</p>
    );
  }

  if (!meta) {
    return <p className="text-muted-foreground text-sm">Loading invitation…</p>;
  }

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="font-heading text-2xl font-bold">Provider invitation</h1>
      <p className="text-sm">
        <strong>{meta.provider.name}</strong> invited you to join their team as a
        support worker.
      </p>
      <p className="text-sm text-muted-foreground">
        Invitation for: {meta.email} · Status: {meta.status}
      </p>

      {meta.status !== "pending" && (
        <p className="text-sm">
          This invitation is no longer active ({meta.status}).
        </p>
      )}

      {meta.status === "pending" && (
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="default"
            size="default"
            loading={loading}
            onClick={async () => {
              setLoading(true);
              setError("");
              const res = await fetch(`/api/worker-invites/${token}/accept`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
              });
              const data = await res.json();
              setLoading(false);
              if (!res.ok) {
                if (res.status === 401) {
                  setError("Sign in with the invited email, then try again.");
                  return;
                }
                setError(data.error ?? "Could not accept invitation");
                return;
              }
              router.push("/worker/affiliations");
            }}
          >
            Accept invitation
          </Button>
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={async () => {
              await fetch(`/api/worker-invites/${token}/decline`, {
                method: "POST",
              });
              router.push("/worker/affiliations");
            }}
          >
            Decline
          </Button>
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <p className="text-sm">
        <Link href="/login" className="underline">
          Sign in
        </Link>{" "}
        if you need to authenticate before accepting.
      </p>
    </div>
  );
}
