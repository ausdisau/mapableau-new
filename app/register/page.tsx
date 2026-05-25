import Link from "next/link";

import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleLoginNotice } from "@/components/auth/GoogleLoginNotice";
import { SecureIdentityNotice } from "@/components/auth/SecureIdentityNotice";

export default function RegisterPage() {
  return (
    <AuthShell title="Create your MapAble account">
      <div className="space-y-6">
        <SecureIdentityNotice />
        <GoogleLoginNotice />
        <p className="text-sm text-muted-foreground">
          Register using Google through our secure login. MapAble will ask you to
          choose your role and privacy preferences after your first sign-in.
        </p>
        <a
          href="/auth/login?returnTo=/onboarding/role"
          className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Continue with Google to register
        </a>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="underline focus-visible:outline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
