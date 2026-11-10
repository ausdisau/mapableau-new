"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type ClerkAuthControlsProps = {
  compact?: boolean;
};

export function ClerkAuthControls({ compact = false }: ClerkAuthControlsProps) {
  const className = compact
    ? "flex flex-col gap-2"
    : "flex items-center gap-3";
  const loginClassName = compact
    ? `min-h-11 w-full rounded-xl border-2 border-[#0C1833] px-4 py-2 text-center text-sm font-black transition hover:bg-slate-50 ${mapableCareFocusRing}`
    : `min-h-11 rounded-xl border-2 border-[#0C1833] px-5 py-3 text-sm font-black transition hover:bg-slate-50 ${mapableCareFocusRing}`;
  const registerClassName = compact
    ? `min-h-11 w-full rounded-xl bg-[#005B7F] px-4 py-2 text-center text-sm font-black text-white shadow-sm transition hover:bg-[#004766] ${mapableCareFocusRing}`
    : `min-h-11 rounded-xl bg-[#005B7F] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#004766] ${mapableCareFocusRing}`;

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
        <UserButton />
      </Show>
    </div>
  );
}
