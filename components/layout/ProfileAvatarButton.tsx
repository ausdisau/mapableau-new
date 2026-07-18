"use client";

import { forwardRef, useState } from "react";

import { cn } from "@/app/lib/utils";
import {
  getAccountMenuButtonLabel,
  getUserInitials,
} from "@/lib/profile/user-initials";
import type { UserRole } from "@/types/mapable";

type ProfileAvatarButtonProps = {
  userName?: string;
  email?: string;
  role?: UserRole;
  avatarUrl?: string | null;
  showSignedInIndicator?: boolean;
  expanded?: boolean;
  className?: string;
  onClick?: () => void;
};

export const ProfileAvatarButton = forwardRef<
  HTMLButtonElement,
  ProfileAvatarButtonProps
>(function ProfileAvatarButton(
  {
    userName,
    email,
    role,
    avatarUrl,
    showSignedInIndicator = true,
    expanded = false,
    className,
    onClick,
  },
  ref
) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = getUserInitials(userName, email);
  const label = getAccountMenuButtonLabel(userName, role);
  const showImage = Boolean(avatarUrl) && !imageFailed;

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={expanded}
      aria-label={label}
      className={cn(
        "relative inline-flex h-11 w-11 min-h-11 min-w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 text-sm font-black text-[#0C1833]",
        "transition hover:border-slate-300 hover:bg-slate-50",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40 focus-visible:ring-offset-2",
        className
      )}
    >
      {showImage ? (
        // Decorative: accessible name is on the button.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl ?? undefined}
          alt=""
          width={44}
          height={44}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span aria-hidden="true" className="select-none">
          {initials}
        </span>
      )}
      {showSignedInIndicator ? (
        <span
          className="absolute bottom-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white bg-emerald-600"
          title="Signed in"
        >
          <span className="sr-only">Signed in</span>
        </span>
      ) : null}
    </button>
  );
});
