"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef } from "react";

import { cn } from "@/app/lib/utils";
import { MapAbleSignOutButton } from "@/components/layout/MapAbleSignOutButton";
import { RoleBadge } from "@/components/ui/role-badge";
import { roleLabel } from "@/lib/auth/roles";
import {
  getAccountMenuActions,
  getUserInitials,
} from "@/lib/profile/user-initials";
import type { UserRole } from "@/types/mapable";

type ProfileAccountDialogProps = {
  open: boolean;
  onClose: () => void;
  userName?: string;
  email?: string;
  role?: UserRole;
  avatarUrl?: string | null;
  /** When true, show Change/Remove picture actions (upload PR). */
  pictureActionsEnabled?: boolean;
};

export function ProfileAccountDialog({
  open,
  onClose,
  userName,
  email,
  role,
  avatarUrl,
  pictureActionsEnabled = false,
}: ProfileAccountDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const initials = getUserInitials(userName, email);
  const actions = getAccountMenuActions(role);
  const displayName = userName?.trim() || "Signed-in user";
  const hasAvatar = Boolean(avatarUrl);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onFocusIn(event: FocusEvent) {
      const panel = panelRef.current;
      if (!panel) return;
      if (event.target instanceof Node && !panel.contains(event.target)) {
        closeButtonRef.current?.focus();
      }
    }

    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center motion-reduce:transition-none">
      <button
        type="button"
        className="absolute inset-0 bg-[#0C1833]/50 backdrop-blur-[1px]"
        aria-label="Dismiss account menu"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn(
          "relative z-10 flex max-h-[min(90vh,40rem)] w-full max-w-md flex-col overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl",
          "motion-safe:transition-opacity motion-reduce:transition-none"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-black text-[#0C1833]">
            Account
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
          >
            <span className="sr-only">Close account menu</span>
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <p id={descriptionId} className="mt-1 text-sm font-semibold text-emerald-800">
          Signed in
          {role ? ` as ${roleLabel(role)}` : ""}
        </p>

        <div className="mt-4 flex items-center gap-3">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 text-base font-black text-[#0C1833]"
            aria-hidden="true"
          >
            {hasAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl ?? undefined}
                alt=""
                width={56}
                height={56}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-black text-[#0C1833]">
              {displayName}
            </p>
            {email ? (
              <p className="truncate text-sm text-slate-600">{email}</p>
            ) : null}
            {role ? (
              <div className="mt-1">
                <RoleBadge role={role} />
              </div>
            ) : null}
          </div>
        </div>

        <nav className="mt-5 flex flex-col gap-2" aria-label="Account actions">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              onClick={onClose}
              className="min-h-11 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-[#0C1833] transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
            >
              {action.label}
            </Link>
          ))}

          {pictureActionsEnabled ? (
            <>
              <button
                type="button"
                className="min-h-11 rounded-xl border border-slate-200 px-4 py-2.5 text-left text-sm font-bold text-[#0C1833] transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
              >
                Change profile picture
              </button>
              {hasAvatar ? (
                <button
                  type="button"
                  className="min-h-11 rounded-xl border border-slate-200 px-4 py-2.5 text-left text-sm font-bold text-[#0C1833] transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
                >
                  Remove profile picture
                </button>
              ) : null}
            </>
          ) : null}
        </nav>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <MapAbleSignOutButton />
        </div>
      </div>
    </div>
  );
}
