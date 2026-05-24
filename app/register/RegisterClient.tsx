"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

import { OAuthSignInButtons } from "@/components/auth/OAuthSignInButtons";
import { Button } from "@/components/ui/button";

type RegisterClientProps = {
  oauthProviders?: string[];
};

export default function RegisterClient({
  oauthProviders = [],
}: RegisterClientProps) {
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
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-10 flex max-w-md flex-col gap-6">
      <OAuthSignInButtons
        callbackUrl="/dashboard"
        providers={oauthProviders}
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isLoading}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" variant="default" size="default" disabled={isLoading}>
          {isLoading ? "Creating account…" : "Register with email"}
        </Button>
      </form>
    </div>
  );
}
