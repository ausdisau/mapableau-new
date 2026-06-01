"use client";

import Link from "next/link";
import { useState } from "react";

import { normalizeAuthEmail } from "@/lib/auth/auth-flow";

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setIsLoading(true);

        try {
          const res = await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: normalizeAuthEmail(email) }),
          });
          const data = (await res.json()) as { message?: string; error?: string };

          if (!res.ok) {
            setError(data.error || "Could not send reset instructions.");
            setIsLoading(false);
            return;
          }

          setMessage(
            data.message ||
              "If an account exists for that email, we sent password reset instructions."
          );
          setIsLoading(false);
        } catch {
          setError("Something went wrong. Please try again.");
          setIsLoading(false);
        }
      }}
    >
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={isLoading}
        autoComplete="email"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      <button type="submit" disabled={isLoading} className="disabled:opacity-60">
        {isLoading ? "Sending…" : "Send reset link"}
      </button>
      <p className="text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
