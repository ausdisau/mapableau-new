import type { MapAbleUserRole } from "@prisma/client";

import { MfaEnrollmentPanel } from "@/components/security/MfaEnrollmentPanel";
import { requireAuth } from "@/lib/auth/guards";
import { roleRequiresMfaEnrollment } from "@/lib/auth/mfa-policy";
import { userHasMfaEnrolled } from "@/lib/auth/mfa-service";

type SecurityPageProps = {
  searchParams: Promise<{ required?: string }>;
};

export const metadata = {
  title: "Security & MFA | MapAble Core",
};

export default async function SecuritySettingsPage({
  searchParams,
}: SecurityPageProps) {
  const user = await requireAuth();
  const params = await searchParams;
  const enrolled = await userHasMfaEnrolled(user.id);
  const enrollmentRequired =
    params.required === "1" ||
    (roleRequiresMfaEnrollment(user.primaryRole as MapAbleUserRole) &&
      !enrolled);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">
          Security & multi-factor authentication
        </h1>
        <p className="mt-2 text-muted-foreground">
          Protect your account and sensitive participant, billing, and NDIS
          data. We use an authenticator app and recovery codes — not SMS as the
          primary method.
        </p>
      </header>

      <MfaEnrollmentPanel
        primaryRole={user.primaryRole}
        enrollmentRequired={enrollmentRequired}
      />

      <section className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
        <h2 className="font-semibold text-foreground">Need help?</h2>
        <p className="mt-2">
          If you are locked out, email{" "}
          <a
            href="mailto:support@mapable.com.au?subject=MFA%20help"
            className="underline underline-offset-2"
          >
            support@mapable.com.au
          </a>
          . Have another sign-in method ready if you remove MFA from a
          privileged account.
        </p>
      </section>
    </div>
  );
}
