"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { CoreAuthForm } from "@/components/core/CoreAuthForm";
import { CoreAuthLinks } from "@/components/core/CoreAuthLinks";
import { CorePageContainer } from "@/components/core/CorePageContainer";
import { CorePageHeader } from "@/components/core/CorePageHeader";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setIsLoading(false);
        return;
      }

      await signIn("credentials", {
        email,
        password,
        callbackUrl: "/dashboard",
      });
    } catch (err: unknown) {
      setIsLoading(false);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong");
      }
    }
  };

  return (
    <CorePageContainer variant="narrow">
      <CorePageHeader
        title="Create account"
        description="Join MapAble Core to manage care, transport and your profile."
      />
      <CoreAuthForm
        onSubmit={handleSubmit}
        error={error}
        isLoading={isLoading}
        submitLabel="Register"
        footer={<CoreAuthLinks mode="register" />}
      >
        <AccessibleFormField id="register-name" label="Name" required>
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
        <AccessibleFormField id="register-email" label="Email" required>
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
          hint="Use a strong password you do not reuse elsewhere."
        >
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            className={formInputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </AccessibleFormField>
      </CoreAuthForm>
    </CorePageContainer>
  );
}
