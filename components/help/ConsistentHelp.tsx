"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function ConsistentHelp({
  contextTitle,
  plainLanguage,
  contactHref = "/contact",
  safetyNote,
}: {
  contextTitle: string;
  plainLanguage: string;
  contactHref?: string;
  safetyNote?: string;
}) {
  const dialogId = useId();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!open) {
      if (wasOpenRef.current) {
        triggerRef.current?.focus();
      }
      wasOpenRef.current = false;
      return;
    }
    wasOpenRef.current = true;
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="consistent-help" data-testid="consistent-help">
      <button
        ref={triggerRef}
        type="button"
        className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border-2 border-[#0C1833] px-3 text-sm font-black ${mapableCareFocusRing}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        onClick={() => setOpen(true)}
      >
        Help
      </button>

      {open ? (
        <div
          id={dialogId}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0C1833]/45 p-4 sm:items-center"
        >
          <div
            ref={panelRef}
            className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-5 shadow-xl"
          >
            <button
              ref={closeRef}
              type="button"
              className={`mb-3 inline-flex min-h-11 items-center rounded-xl border-2 border-[#0C1833] px-4 text-sm font-black ${mapableCareFocusRing}`}
              onClick={() => setOpen(false)}
            >
              Close
            </button>
            <h2 id={titleId} className="text-xl font-black text-[#0C1833]">
              Help: {contextTitle}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">{plainLanguage}</p>
            {safetyNote ? (
              <p className="mt-3 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-950">
                {safetyNote}
              </p>
            ) : null}
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm">
              <li>
                <Link href={contactHref} className="font-bold underline mapable-focus">
                  Contact a person at MapAble
                </Link>
              </li>
              <li>
                <Link
                  href="/accessibility-statement"
                  className="font-bold underline mapable-focus"
                >
                  Accessibility statement and feedback
                </Link>
              </li>
              <li>
                <Link href="/help" className="font-bold underline mapable-focus">
                  Help Centre
                </Link>
              </li>
              <li>
                Preferred contact method can be set in your profile. A chatbot is
                never the only option for blocked or safety-critical tasks.
              </li>
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
