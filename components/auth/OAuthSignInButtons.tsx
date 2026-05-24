"use client";

import { signIn } from "next-auth/react";

import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";

type OAuthSignInButtonsProps = {
  callbackUrl?: string;
  providers?: string[];
  className?: string;
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 23 23" aria-hidden>
      <path fill="#f35325" d="M1 1h10v10H1z" />
      <path fill="#81bc06" d="M12 1h10v10H12z" />
      <path fill="#05a6f0" d="M1 12h10v10H1z" />
      <path fill="#ffba08" d="M12 12h10v10H12z" />
    </svg>
  );
}

export function OAuthSignInButtons({
  callbackUrl = "/auth/complete",
  providers = [],
  className,
}: OAuthSignInButtonsProps) {
  const showGoogle = providers.includes("google");
  const showMicrosoft = providers.includes("azure-ad");

  if (!showGoogle && !showMicrosoft) return null;

  return (
    <section
      aria-labelledby="login-oauth-heading"
      className={cn("space-y-3", className)}
    >
      <h2 id="login-oauth-heading" className="text-sm font-semibold">
        Or continue with
      </h2>

      <div className="flex flex-col gap-2">
        {showGoogle ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full gap-3"
            onClick={() => signIn("google", { callbackUrl })}
            aria-label="Continue with Google"
          >
            <GoogleIcon className="h-5 w-5 shrink-0" />
            Continue with Google
          </Button>
        ) : null}
        {showMicrosoft ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full gap-3"
            onClick={() => signIn("azure-ad", { callbackUrl })}
            aria-label="Continue with Microsoft"
          >
            <MicrosoftIcon className="h-5 w-5 shrink-0" />
            Continue with Microsoft
          </Button>
        ) : null}
      </div>
    </section>
  );
}
