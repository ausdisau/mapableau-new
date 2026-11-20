"use client";

import { useClerk } from "@clerk/nextjs";
import { signOut as nextAuthSignOut } from "next-auth/react";

const BUTTON_CLASS_NAME =
  "rounded-xl border-2 border-slate-200 px-4 py-2 text-sm font-black text-[#0C1833] transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40";

const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim(),
);

function SignOutButtonShell({
  onSignOut,
}: {
  onSignOut: () => void | Promise<void>;
}) {
  return (
    <button
      type="button"
      onClick={() => void onSignOut()}
      className={BUTTON_CLASS_NAME}
    >
      Sign out
    </button>
  );
}

function ClerkAwareSignOutButton() {
  const { signOut: clerkSignOut } = useClerk();

  return (
    <SignOutButtonShell
      onSignOut={async () => {
        await Promise.allSettled([
          nextAuthSignOut({ callbackUrl: "/login", redirect: false }),
          clerkSignOut({ redirectUrl: "/login" }),
        ]);
      }}
    />
  );
}

export function MapAbleSignOutButton() {
  if (!clerkEnabled) {
    return (
      <SignOutButtonShell
        onSignOut={() => nextAuthSignOut({ callbackUrl: "/login" })}
      />
    );
  }

  return <ClerkAwareSignOutButton />;
}
