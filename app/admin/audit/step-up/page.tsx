import Link from "next/link";

import { requirePermission, setMfaStepUpPlaceholder } from "@/lib/auth/guards";

export const metadata = { title: "Audit step-up | Admin" };

export default async function AuditStepUpPage({
  searchParams,
}: {
  searchParams: Promise<{ confirm?: string }>;
}) {
  await requirePermission("audit:read:privileged");
  const { confirm } = await searchParams;

  if (confirm === "1") {
    await setMfaStepUpPlaceholder();
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="font-heading text-2xl font-bold">Step-up verification</h1>
      <p className="text-muted-foreground">
        Raw audit logs require privileged access with multi-factor authentication.
        This is a placeholder step-up flow for development.
      </p>
      <Link
        href="/admin/audit/step-up?confirm=1"
        className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-primary-foreground"
      >
        Confirm step-up (placeholder MFA)
      </Link>
      <p className="text-sm text-muted-foreground">
        After confirming, you may view individual audit event details.
      </p>
    </div>
  );
}
