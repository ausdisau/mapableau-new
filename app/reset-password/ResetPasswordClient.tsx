"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordClient() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionReady(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setSessionReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!sessionReady) {
    return (
      <div className="space-y-4 text-sm">
        <p className="text-red-600">
          This reset link is missing or invalid. Request a new link from the
          forgot-password page.
        </p>
        <Link href="/forgot-password" className="underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }

        setIsLoading(true);

        try {
          const supabase = createSupabaseBrowserClient();
          const { error: updateError } = await supabase.auth.updateUser({
            password,
          });

          if (updateError) {
            setError(updateError.message || "Could not reset password.");
            setIsLoading(false);
            return;
          }

          setMessage("Password updated.");
          setIsLoading(false);
          router.push("/login?reset=success");
        } catch {
          setError("Something went wrong. Please try again.");
          setIsLoading(false);
        }
      }}
    >
      <input
        type="password"
        placeholder="New password (min 8 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={8}
        required
        disabled={isLoading}
        autoComplete="new-password"
      />
      <input
        type="password"
        placeholder="Confirm new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        minLength={8}
        required
        disabled={isLoading}
        autoComplete="new-password"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      <button type="submit" disabled={isLoading} className="disabled:opacity-60">
        {isLoading ? "Updating…" : "Update password"}
      </button>
      <p className="text-sm text-muted-foreground">
        <Link href="/login" className="underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
