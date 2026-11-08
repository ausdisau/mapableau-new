"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/app/lib/utils";
import {
  isNavLinkActive,
  PARTICIPANT_NAV_GROUPS,
  type ParticipantNavLink,
} from "@/lib/dashboard/participant-nav";
import { sidebarNavLinkClass } from "@mapable/ui";

function NavItem({
  link,
  onNavigate,
}: {
  link: ParticipantNavLink;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isNavLinkActive(pathname, link);
  const childId = useId();
  const hasChildren = Boolean(link.children?.length);
  const [open, setOpen] = useState(
    () =>
      active ||
      Boolean(link.children?.some((child) => isNavLinkActive(pathname, child))),
  );

  return (
    <li>
      <div className="flex items-stretch gap-1">
        <Link
          href={link.href}
          aria-current={active ? "page" : undefined}
          className={cn(sidebarNavLinkClass(active), "flex-1")}
          onClick={onNavigate}
        >
          {link.label}
        </Link>
        {hasChildren ? (
          <button
            type="button"
            className="min-h-11 min-w-11 rounded-xl border border-slate-200 text-sm font-bold text-[#005B7F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
            aria-expanded={open}
            aria-controls={childId}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">
              {open ? "Collapse" : "Expand"} {link.label} sublinks
            </span>
            <span aria-hidden="true">{open ? "−" : "+"}</span>
          </button>
        ) : null}
      </div>
      {hasChildren && open ? (
        <ul id={childId} className="ml-3 mt-1 space-y-1 border-l border-slate-200 pl-3">
          {link.children!.map((child) => {
            const childActive = isNavLinkActive(pathname, child);
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  aria-current={childActive ? "page" : undefined}
                  className={sidebarNavLinkClass(childActive)}
                  onClick={onNavigate}
                >
                  {child.label}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}

export function ParticipantWorkspaceSidebar({
  showAdminLink = false,
  onNavigate,
}: {
  showAdminLink?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Participant workspace" data-testid="participant-workspace-nav">
      {PARTICIPANT_NAV_GROUPS.map((group) => (
        <div key={group.id} className="mb-5">
          <p className="px-3 pb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
            {group.label}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => (
              <NavItem key={item.href} link={item} onNavigate={onNavigate} />
            ))}
          </ul>
        </div>
      ))}
      {showAdminLink ? (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <p className="px-3 pb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
            Administration
          </p>
          <ul>
            <li>
              <Link
                href="/admin"
                className={sidebarNavLinkClass(false)}
                onClick={onNavigate}
              >
                Admin workspace
              </Link>
            </li>
          </ul>
        </div>
      ) : null}
    </nav>
  );
}

export function ParticipantWorkspaceMobileNav({
  showAdminLink = false,
}: {
  showAdminLink?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const close = useCallback(() => {
    setOpen(false);
    queueMicrotask(() => openButtonRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    closeButtonRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-2 md:hidden">
        <button
          ref={openButtonRef}
          type="button"
          className="flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#005B7F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(true)}
        >
          Open workspace menu
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Close navigation backdrop"
            onClick={close}
          />
          <div
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="Participant workspace"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <p className="text-sm font-extrabold text-[#005B7F]">Workspace</p>
              <button
                ref={closeButtonRef}
                type="button"
                className="min-h-11 min-w-11 rounded-xl border border-slate-200 px-3 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
                onClick={close}
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <ParticipantWorkspaceSidebar
                showAdminLink={showAdminLink}
                onNavigate={close}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
