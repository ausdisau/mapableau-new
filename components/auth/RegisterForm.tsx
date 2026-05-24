"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import React, { useState } from "react";

import { AuthErrorSummary } from "@/components/auth/AuthErrorSummary";
import { RegistrationRoleSelector } from "@/components/auth/RegistrationRoleSelector";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { Button } from "@/components/ui/button";
import { getRegistrationOnboardingPath } from "@/lib/auth/role-router";
import {
  mapRegistrationTypeToPrimaryRole,
  type RegistrationAccountType,
} from "@/lib/auth/registration-roles";

const inputClassName =
  "min-h-12 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base shadow-sm outline-none transition focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

type RegisterFormProps = {
  oauthProviders?: string[];
};

export function RegisterForm({ oauthProviders = [] }: RegisterFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] =
    useState<RegistrationAccountType>("participant");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="space-y-6">
      <AuthErrorSummary
        errors={errors}
        title="There is a problem with your registration"
      />

      <SocialLoginButtons providers={oauthProviders} />

      <form
        className="space-y-5"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          setErrors([]);

          const nextErrors: string[] = [];
          if (!name.trim()) nextErrors.push("Enter your full name.");
          if (!email.trim()) nextErrors.push("Enter your email address.");
          if (password.length < 8) {
            nextErrors.push("Choose a password with at least 8 characters.");
          }
          if (!acceptedTerms) {
            nextErrors.push("Accept the terms and privacy notice to continue.");
          }
          if (nextErrors.length > 0) {
            setErrors(nextErrors);
            return;
          }

          setIsLoading(true);
          try {
            const res = await fetch("/api/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password,
                accountType,
                acceptedTerms,
              }),
            });
            const data = (await res.json()) as { error?: string };

            if (!res.ok) {
              setErrors([
                data.error ??
                  "We could not create your account. Try a different email or sign in.",
              ]);
              setIsLoading(false);
              return;
            }

            const primaryRole = mapRegistrationTypeToPrimaryRole(accountType);
            const onboardingPath = getRegistrationOnboardingPath(primaryRole);

            const signInResult = await signIn("credentials", {
              email: email.trim().toLowerCase(),
              password,
              redirect: false,
              callbackUrl: onboardingPath,
            });

            if (signInResult?.ok) {
              router.push(onboardingPath);
              router.refresh();
              return;
            }

            setErrors([
              "Account created, but sign-in failed. Please sign in manually.",
            ]);
            setIsLoading(false);
          } catch {
            setErrors(["Something went wrong. Please try again."]);
            setIsLoading(false);
          }
        }}
      >
        <div className="space-y-2">
          <label htmlFor="register-name" className="text-sm font-medium">
            Full name
          </label>
          <input
            id="register-name"
            type="text"
            name="name"
            autoComplete="name"
            required
            disabled={isLoading}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="register-email" className="text-sm font-medium">
            Email address
          </label>
          <input
            id="register-email"
            type="email"
            name="email"
            autoComplete="email"
            required
            disabled={isLoading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="register-password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="register-password"
            type="password"
            name="new-password"
            autoComplete="new-password"
            required
            minLength={8}
            disabled={isLoading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClassName}
          />
          <p className="text-xs text-muted-foreground">
            At least 8 characters. Do not include NDIS numbers or health records
            here.
          </p>
        </div>

        <RegistrationRoleSelector
          value={accountType}
          onChange={setAccountType}
          disabled={isLoading}
        />

        <label className="flex min-h-12 items-start gap-3 rounded-xl border border-border px-4 py-3">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            disabled={isLoading}
            required
            className="mt-1 h-4 w-4 shrink-0 rounded border-input accent-primary"
          />
          <span className="text-sm text-muted-foreground">
            I agree to the MapAble terms of use and privacy notice. I understand
            my selected account type does not automatically verify me as a
            provider or worker.
          </span>
        </label>

        <Button
          type="submit"
          variant="default"
          size="lg"
          className="w-full"
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
