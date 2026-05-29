"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { CoreAuthForm } from "@/components/core/CoreAuthForm";
import { CoreAuthLinks } from "@/components/core/CoreAuthLinks";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <CoreAuthForm
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
          const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
            callbackUrl,
          });

          if (result?.error) {
            setError("Invalid email or password");
            setIsLoading(false);
            return;
          }

          if (result?.ok === true) {
            setIsLoading(false);
            router.push(callbackUrl);
            router.refresh();
            return;
          }

          setError("An unexpected error occurred. Please try again.");
          setIsLoading(false);
        } catch {
          setError("An error occurred. Please try again.");
          setIsLoading(false);
        }
      }}
      error={error}
      isLoading={isLoading}
      submitLabel="Sign in"
      footer={<CoreAuthLinks mode="login" />}
    >
      <AccessibleFormField id="login-email" label="Email" required>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          className={formInputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </AccessibleFormField>
      <AccessibleFormField id="login-password" label="Password" required>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          className={formInputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </AccessibleFormField>
    </CoreAuthForm>
  );
}
