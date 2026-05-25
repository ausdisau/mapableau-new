import { Suspense } from "react";

import { AccountLinkingConfirmation } from "@/components/auth/AccountLinkingConfirmation";
import { AuthShell } from "@/components/auth/AuthShell";

function LinkAccountInner({ token }: { token: string }) {
  return <AccountLinkingConfirmation token={token} />;
}

export default function LinkAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <AuthShell title="Link your account">
      <Suspense fallback={<p aria-live="polite">Loading…</p>}>
        <LinkAccountContent searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function LinkAccountContent({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;
  if (!token) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Missing link token. Please sign in again.
      </p>
    );
  }
  return <LinkAccountInner token={token} />;
}
