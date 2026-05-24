import { AuthCard } from "@/components/auth/AuthCard";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterPrompt } from "@/components/auth/RegisterPrompt";
import { SecurePortalNotice } from "@/components/auth/SecurePortalNotice";

export default function RegisterPage() {
  return (
    <AuthShell>
      <header className="mb-6 space-y-2 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          MapAble secure portal
        </p>
        <h1 id="auth-card-heading" className="text-3xl font-bold tracking-tight">
          Get started
        </h1>
        <p className="text-muted-foreground">
          Create your MapAble account through Australian Disability Ltd identity
          services.
        </p>
      </header>

      <SecurePortalNotice />

      <AuthCard className="mt-6">
        <RegisterPrompt />
      </AuthCard>
    </AuthShell>
  );
}
