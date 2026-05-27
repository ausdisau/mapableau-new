"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

type AccountType = "participant" | "support_worker";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("participant");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, accountType }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      await signIn("credentials", {
        email,
        password,
        callbackUrl: data.redirectTo ?? "/dashboard",
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong");
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto mt-10 flex flex-col gap-4"
    >
      <h1 className="text-xl font-semibold">Create your account</h1>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">I am registering as</legend>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="accountType"
            value="participant"
            checked={accountType === "participant"}
            onChange={() => setAccountType("participant")}
          />
          Participant (NDIS participant or person receiving support)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="accountType"
            value="support_worker"
            checked={accountType === "support_worker"}
            onChange={() => setAccountType("support_worker")}
          />
          Support worker
        </label>
      </fieldset>

      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password (min 8 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={8}
        required
      />
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit" className="bg-blue-600 text-white py-2 rounded">
        Register
      </button>
    </form>
  );
}
