import { Suspense } from "react";

import { AuthShell } from "@/components/auth/AuthShell";
import { LoginCard } from "@/components/auth/LoginCard";

export default function LoginPage() {
  return (
    <AuthShell title="Sign in securely with MapAble">
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Loading sign-in…
          </p>
        }
      >
        <LoginCard />
      </Suspense>
    </AuthShell>
  );
}
