"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useId, useRef, useState } from "react";

import { SignInForm } from "@/components/auth/SignInForm";
import { MapAbleSignOutButton } from "@/components/layout/MapAbleSignOutButton";
import { RoleBadge } from "@/components/ui/role-badge";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { safeAuthCallbackPath } from "@/lib/auth/auth-flow";
import { ALL_ROLES, defaultDashboardPath } from "@/lib/auth/roles";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import type { UserRole } from "@/types/mapable";

const AUTH_FORM_PATHS = ["/login", "/register", "/forgot-password"] as const;

function isAuthFormPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return AUTH_FORM_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function asUserRole(value: string | undefined): UserRole | undefined {
  if (!value) return undefined;
  return ALL_ROLES.includes(value as UserRole)
    ? (value as UserRole)
    : undefined;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  const first = parts[0]![0] ?? "";
  const last = parts[parts.length - 1]![0] ?? "";
  return `${first}${last}`.toUpperCase();
}

function PersonSilhouette() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 text-slate-500"
    >
      <path
        fill="currentColor"
        d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12Zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v1.2c0 .7.5 1.2 1.2 1.2h16.8c.7 0 1.2-.5 1.2-1.2v-1.2c0-3.2-6.4-4.8-9.6-4.8Z"
      />
    </svg>
  );
}

export function MapAbleUserBar({
  userName,
  role,
}: {
  userName?: string;
  role?: UserRole;
}) {
  const { status, data } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const sessionUser = data?.user;
  const resolvedName = sessionUser?.name?.trim() || userName?.trim() || "";
  const resolvedRole =
    asUserRole(sessionUser?.role) ?? role;
  const resolvedEmail = sessionUser?.email ?? null;
  const resolvedImage = sessionUser?.image ?? null;
  const mfaVerified = sessionUser?.mfaVerified === true;
  const isAuthenticated =
    status === "authenticated" ||
    (status === "loading" && Boolean(userName));
  const isLoading = status === "loading" && !userName && !sessionUser;
  const hideNestedForm = isAuthFormPath(pathname);
  const callbackUrl = safeAuthCallbackPath(pathname, "/dashboard");
  const triggerLabel = isLoading
    ? "Account menu, checking sign-in"
    : isAuthenticated
      ? `Account menu, signed in as ${resolvedName || "you"}`
      : "Account menu, not signed in";
  const dialogTitle = isAuthenticated ? "Your account" : "Sign in";
  const ringClass = isAuthenticated
    ? "border-[#005B7F]"
    : "border-slate-300";

  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div
      className={`relative ${open ? "z-[70]" : ""}`}
      data-testid="mapable-user-bar"
    >
      <button
        type="button"
        data-testid="mapable-user-bar-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? "mapable-user-bar-dialog" : undefined}
        aria-busy={isLoading || undefined}
        aria-label={triggerLabel}
        disabled={isLoading}
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex h-11 w-11 min-h-11 min-w-11 items-center justify-center overflow-hidden rounded-full border-2 bg-white ${ringClass} transition hover:bg-slate-50 disabled:opacity-70 ${mapableCareFocusRing}`}
      >
        {isLoading ? (
          <span
            className="h-6 w-6 animate-pulse rounded-full bg-slate-200"
            aria-hidden="true"
          />
        ) : isAuthenticated && resolvedImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolvedImage}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : isAuthenticated && resolvedName ? (
          <span className="text-sm font-black text-[#005B7F]" aria-hidden="true">
            {initialsFromName(resolvedName)}
          </span>
        ) : (
          <PersonSilhouette />
        )}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-black/20"
            aria-label="Close account menu"
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            id="mapable-user-bar-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            data-testid="mapable-user-bar-dialog"
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(92vw,24rem)] max-h-[min(80vh,40rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-300/40"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2
                id={titleId}
                className="text-base font-black text-[#0C1833]"
              >
                {dialogTitle}
              </h2>
              <button
                type="button"
                className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl px-2 text-sm font-bold text-slate-600 hover:bg-slate-50 ${mapableCareFocusRing}`}
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            {isAuthenticated ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-black text-[#0C1833]">
                  {resolvedName || "Signed in"}
                </p>
                {resolvedEmail ? (
                  <p className="text-sm text-slate-600">{resolvedEmail}</p>
                ) : null}
                {resolvedRole ? <RoleBadge role={resolvedRole} /> : null}
                {sessionUser ? (
                  <p className="text-sm text-slate-600">
                    {mfaVerified
                      ? "Signed in with extra verification"
                      : "Password sign-in"}
                  </p>
                ) : null}
                <p className="text-xs leading-5 text-slate-500">
                  This shows whether you are signed in. It is not a worker
                  clearance.
                </p>
                <Link
                  href={
                    resolvedRole
                      ? defaultDashboardPath(resolvedRole)
                      : "/dashboard"
                  }
                  className={`inline-flex min-h-11 items-center justify-center rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white hover:bg-[#004766] ${mapableCareFocusRing}`}
                >
                  Open dashboard
                </Link>
                <MapAbleSignOutButton />
              </div>
            ) : hideNestedForm ? (
              <p className="text-sm leading-6 text-slate-600">
                Use the form on this page to sign in or create an account.
              </p>
            ) : (
              <SignInForm
                callbackUrl={callbackUrl}
                variant="header"
                idPrefix="header-signin"
              />
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
