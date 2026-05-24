"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function AccountLinkingConfirmation({
  profileId,
  email,
}: {
  profileId: string;
  email?: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-4">
      <p>
        We found an existing MapAble profile for{" "}
        <strong>{email ?? "your email address"}</strong>. To protect your account,
        please confirm that you want to link this sign-in method.
      </p>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="default"
          size="lg"
          loading={loading}
          onClick={async () => {
            setLoading(true);
            setError("");

            try {
              const response = await fetch("/api/auth/link-identity", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  profileId,
                  confirm: true,
                  auth0UserId: "session",
                  provider: "auth0",
                }),
              });

              if (!response.ok) {
                const data = (await response.json()) as { error?: string };
                setError(data.error ?? "Could not link accounts.");
                return;
              }

              router.push("/onboarding");
              router.refresh();
            } finally {
              setLoading(false);
            }
          }}
        >
          Yes, link my account
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.push("/support")}
        >
          Contact support
        </Button>
      </div>
    </div>
  );
}
