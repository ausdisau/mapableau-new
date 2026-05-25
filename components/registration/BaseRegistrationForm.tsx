"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export function BaseRegistrationForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setStatus("Creating your account…");

        const res = await fetch("/api/registration/base", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setStatus("");
          setError(data.error ?? "Registration failed");
          return;
        }

        const signInResult = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (signInResult?.error) {
          setStatus("");
          setError("Account created but sign-in failed. Please log in.");
          return;
        }

        setStatus("Account created. Continuing to onboarding…");
        router.push("/onboarding/role");
        router.refresh();
      }}
      className="flex flex-col gap-4"
      aria-describedby={error ? "reg-error" : undefined}
    >
      {error ? (
        <div
          id="reg-error"
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 p-3 text-red-900 text-sm"
        >
          {error}
        </div>
      ) : null}

      <div>
        <label htmlFor="reg-name" className="block text-sm font-medium mb-1">
          Full name
        </label>
        <input
          id="reg-name"
          name="name"
          required
          autoComplete="name"
          className="w-full min-h-11 px-3 border border-slate-300 rounded-md"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="reg-email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full min-h-11 px-3 border border-slate-300 rounded-md"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="reg-password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <input
          id="reg-password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full min-h-11 px-3 border border-slate-300 rounded-md"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="min-h-11 rounded-md bg-blue-700 text-white font-medium hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        Create account
      </button>

      <p aria-live="polite" className="text-sm text-slate-600 min-h-[1.25rem]">
        {status}
      </p>
    </form>
  );
}
