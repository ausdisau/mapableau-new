"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthFormCard } from "@/components/auth/AuthFormCard";
import { redirectAfterAuth, safeAuthCallbackPath } from "@/lib/auth/auth-flow";

export function MagicLinkClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const callbackUrl = safeAuthCallbackPath(
    searchParams.get("callbackUrl"),
    "/dashboard",
  );
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"working" | "error">("working");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("This sign-in link is missing or incomplete.");
      return;
    }

    let cancelled = false;
    void (async () => {
      const result = await signIn("credentials", {
        magicLinkToken: token,
        redirect: false,
        callbackUrl,
      });
      if (cancelled) return;
      if (result?.error || result?.ok !== true) {
        setStatus("error");
        setError(
          "This sign-in link is invalid or has expired. Request a new link from the sign-in page.",
        );
        return;
      }
      redirectAfterAuth(callbackUrl);
    })();

    return () => {
      cancelled = true;
    };
  }, [token, callbackUrl]);

  return (
    <AuthFormCard
      title="Email sign-in"
      description="Completing your passwordless sign-in."
      footer={
        <>
          Prefer another method?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </>
      }
    >
      {status === "working" ? (
        <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
          Signing you in with your email link…
        </p>
      ) : (
        <AuthAlert variant="error">{error}</AuthAlert>
      )}
    </AuthFormCard>
  );
}
