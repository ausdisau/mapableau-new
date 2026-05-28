"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

import type { Auth0SocialConnection } from "@/lib/auth/auth0-social-connections";

type Auth0SocialSignInProps = {
  connections: Auth0SocialConnection[];
  callbackUrl: string;
  disabled?: boolean;
  onError?: (message: string) => void;
};

export function Auth0SocialSignIn({
  connections,
  callbackUrl,
  disabled = false,
  onError,
}: Auth0SocialSignInProps) {
  const [pendingConnection, setPendingConnection] = useState<string | null>(
    null
  );

  if (connections.length === 0) return null;

  return (
    <div className="space-y-2">
      {connections.map((item) => (
        <button
          key={item.id}
          type="button"
          disabled={disabled || pendingConnection !== null}
          className="w-full rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          onClick={() => {
            setPendingConnection(item.connection);
            onError?.("");
            void signIn("auth0", {
              callbackUrl,
              authorizationParams: { connection: item.connection },
            });
          }}
        >
          {pendingConnection === item.connection
            ? `Redirecting to ${item.label.replace("Continue with ", "")}…`
            : item.label}
        </button>
      ))}
    </div>
  );
}
