"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type ClerkAuthControlsProps = {
  compact?: boolean;
};

function authLinkClassNames(compact: boolean) {
  const loginClassName = compact
    ? `min-h-11 w-full rounded-xl border-2 border-[#0C1833] px-4 py-2 text-center text-sm font-black transition hover:bg-slate-50 ${mapableCareFocusRing}`
    : `min-h-11 rounded-xl border-2 border-[#0C1833] px-5 py-3 text-sm font-black transition hover:bg-slate-50 ${mapableCareFocusRing}`;
  const registerClassName = compact
    ? `min-h-11 w-full rounded-xl bg-[#005B7F] px-4 py-2 text-center text-sm font-black text-white shadow-sm transition hover:bg-[#004766] ${mapableCareFocusRing}`
    : `min-h-11 rounded-xl bg-[#005B7F] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#004766] ${mapableCareFocusRing}`;
  return { loginClassName, registerClassName };
}

export function ClerkAuthControls({ compact = false }: ClerkAuthControlsProps) {
  const className = compact
    ? "flex flex-col gap-2"
    : "flex items-center gap-3";
  const { loginClassName, registerClassName } = authLinkClassNames(compact);
  const clerkEnabled = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim(),
  );

  if (!clerkEnabled) {
    return (
      <div className={className}>
        <Link href="/login" className={loginClassName}>
          Log in
        </Link>
        <Link href="/register" className={registerClassName}>
          Get started
        </Link>
      </div>
    );
  }

  return (
    <div className={className}>
      <Show when="signed-out">
        <SignInButton mode="redirect" forceRedirectUrl="/dashboard">
          <button type="button" className={loginClassName}>
            Log in
          </button>
        </SignInButton>
        <SignUpButton mode="redirect" forceRedirectUrl="/dashboard">
          <button type="button" className={registerClassName}>
            Get started
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        {/* UserButton only clears Clerk; ClerkNextAuthSignOutBridge also clears NextAuth. */}
        <UserButton />
      </Show>
    </div>
  );
}
