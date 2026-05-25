"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export default function RegisterClient() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="space-y-6">
      <form
        className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setIsLoading(true);

          try {
            const res = await fetch("/api/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password, name }),
            });

            const data = (await res.json()) as { error?: string };

            if (!res.ok) {
              setError(
                data.error ??
                  "We could not create your account. Check your details or try signing in."
              );
              setIsLoading(false);
              return;
            }

            await signIn("credentials", {
              email,
              password,
              callbackUrl: "/onboarding/role",
            });
          } catch (err: unknown) {
            setError(
              err instanceof Error
                ? err.message
                : "Something went wrong. Please try again."
            );
            setIsLoading(false);
          }
        }}
        noValidate
      >
        <AccessibleFormField
          id="register-name"
          label="Your name"
          required
          hint="How you would like to be addressed in MapAble."
        >
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            className={formInputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isLoading}
          />
        </AccessibleFormField>

        <AccessibleFormField
          id="register-email"
          label="Email"
          required
          hint="Used to sign in and receive important account messages."
        >
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            className={formInputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </AccessibleFormField>

        <AccessibleFormField
          id="register-password"
          label="Password"
          required
          hint="Choose a strong password you do not use on other sites."
        >
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            className={formInputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            disabled={isLoading}
          />
        </AccessibleFormField>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="default"
          size="lg"
          className="w-full min-h-12"
          loading={isLoading}
        >
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
