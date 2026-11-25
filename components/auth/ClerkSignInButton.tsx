"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ClerkSignInButton({ callbackUrl }: { callbackUrl: string }) {
  const [opening, setOpening] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <>
      <Button
        disabled={opening}
        onClick={async () => {
          setOpening(true);
          setFailed(false);
          try {
            await signIn("adid", { callbackUrl });
          } catch {
            setFailed(true);
            setOpening(false);
          }
        }}
      >
        {opening ? "Opening AD.iD…" : "Sign in with AD.iD"}
      </Button>
      {failed && (
        <p role="alert">AD.iD could not open. Try signing in again.</p>
      )}
    </>
  );
}
