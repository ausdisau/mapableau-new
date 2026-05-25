"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { AuthErrorSummary } from "@/components/auth/AuthErrorSummary";
import { GoogleLoginNotice } from "@/components/auth/GoogleLoginNotice";
import { SecureIdentityNotice } from "@/components/auth/SecureIdentityNotice";
import { sanitizeReturnTo } from "@/lib/auth/safe-return-to";

export function LoginCard() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));
  const loginHref = `/auth/login?returnTo=${encodeURIComponent(returnTo)}`;

  const errors: string[] = [];
  if (error) {
    errors.push(
      error === "access_denied"
        ? "Sign-in was cancelled."
        : "Sign-in failed. Please try again."
    );
  }

  return (
    <div className="space-y-6">
      <AuthErrorSummary errors={errors} />
      <SecureIdentityNotice />
      <GoogleLoginNotice />
      <a
        href={loginHref}
        className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Continue with Google
      </a>
      <p className="text-center text-sm text-muted-foreground">
        New to MapAble?{" "}
        <Link href="/register" className="underline focus-visible:outline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
