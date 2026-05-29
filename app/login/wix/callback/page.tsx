"use client";

import { useEffect, useState } from "react";

function parseFragment(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const params = new URLSearchParams(hash);
  const out: Record<string, string> = {};
  params.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

export default function WixCallbackPage() {
  const [message, setMessage] = useState("Completing Wix sign-in…");

  useEffect(() => {
    const fragment = parseFragment();

    if (fragment.error) {
      setMessage(
        fragment.error_description ??
          `Wix sign-in failed (${fragment.error}).`
      );
      return;
    }

    const code = fragment.code;
    const state = fragment.state;
    if (!code || !state) {
      setMessage("Missing authorization data from Wix. Try signing in again.");
      return;
    }

    void (async () => {
      try {
        const res = await fetch("/api/auth/wix/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, state }),
        });
        const data = (await res.json()) as { completeUrl?: string; redirectTo?: string };

        if (data.completeUrl) {
          window.location.href = data.completeUrl;
          return;
        }

        if (data.redirectTo) {
          window.location.href = data.redirectTo;
          return;
        }

        setMessage("Unexpected response from the server. Try again from the login page.");
      } catch {
        setMessage("Network error while completing Wix sign-in.");
      }
    })();
  }, []);

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-heading text-xl font-bold">Wix sign-in</h1>
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      <p className="mt-6">
        <a href="/login" className="text-sm underline">
          Back to login
        </a>
      </p>
    </main>
  );
}
