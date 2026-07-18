"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ProfileAccountDialog } from "@/components/layout/ProfileAccountDialog";
import { ProfileAvatarButton } from "@/components/layout/ProfileAvatarButton";
import { RoleBadge } from "@/components/ui/role-badge";
import type { UserRole } from "@/types/mapable";

export function MapAbleUserBar({
  userName,
  role,
  email,
  avatarUrl = null,
}: {
  userName?: string;
  role?: UserRole;
  email?: string;
  avatarUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (wasOpenRef.current && !open) {
      triggerRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ProfileAvatarButton
        ref={triggerRef}
        userName={userName}
        email={email}
        role={role}
        avatarUrl={avatarUrl}
        expanded={open}
        onClick={() => setOpen(true)}
      />

      <div className="hidden min-w-0 flex-col sm:flex">
        <span className="text-xs font-semibold text-emerald-800">Signed in</span>
        {userName ? (
          <span className="truncate text-sm font-bold text-slate-600">
            {userName}
          </span>
        ) : null}
      </div>

      {role ? <RoleBadge role={role} /> : null}

      <ProfileAccountDialog
        open={open}
        onClose={handleClose}
        userName={userName}
        email={email}
        role={role}
        avatarUrl={avatarUrl}
        pictureActionsEnabled={false}
      />
    </div>
  );
}
