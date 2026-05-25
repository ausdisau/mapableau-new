import { HIPAA_DISCLAIMER } from "@/lib/compliance/security-risk-review-service";

export function SecureIdentityNotice() {
  return (
    <aside
      className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground"
      aria-label="Identity and privacy notice"
    >
      <p className="mb-2 font-medium text-foreground">
        Sign in securely with MapAble
      </p>
      <p className="mb-2">
        Do not use a shared account for MapAble. Your disability and support
        information stays in MapAble — not in Google or Auth0 profile data.
      </p>
      <p className="text-xs">{HIPAA_DISCLAIMER}</p>
    </aside>
  );
}
