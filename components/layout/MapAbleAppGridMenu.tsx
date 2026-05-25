"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/app/lib/utils";
import {
  getMapAbleAppMenuItems,
  type MapAbleAppMenuItem,
} from "@/lib/navigation/mapable-app-menu";
import type { UserRole } from "@/types/mapable";

function NineDotIcon() {
  return (
    <span
      className="grid h-5 w-5 grid-cols-3 gap-0.5"
      aria-hidden="true"
    >
      {Array.from({ length: 9 }).map((_, index) => (
        <span key={index} className="rounded-[2px] bg-current" />
      ))}
    </span>
  );
}

function AppTile({
  item,
  active,
  onClick,
}: {
  item: MapAbleAppMenuItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={cn(
        "group flex min-h-28 flex-col items-center rounded-xl border border-border bg-background p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "border-primary bg-primary/5" : ""
      )}
    >
      <Image
        src={item.imageSrc}
        alt={`${item.label} logo`}
        width={48}
        height={48}
        className="h-12 w-12 rounded-lg object-contain"
        loading="lazy"
      />
      <span className="mt-2 text-sm font-semibold text-foreground">
        {item.label}
      </span>
      <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">
        {item.description}
      </span>
    </Link>
  );
}

export function MapAbleAppGridMenu({
  userRole,
  align = "right",
}: {
  userRole?: UserRole;
  align?: "left" | "right";
}) {
  const pathname = usePathname();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const items = getMapAbleAppMenuItems(userRole);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function isActive(href: string) {
    if (href === "/core") return pathname === "/core";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-input bg-background p-2 text-muted-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Open MapAble app menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <NineDotIcon />
      </button>

      {open ? (
        <div
          id={menuId}
          className={cn(
            "absolute z-50 mt-2 w-[min(92vw,28rem)] rounded-2xl border border-border bg-card p-4 shadow-xl",
            align === "right" ? "right-0" : "left-0"
          )}
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${menuId}-heading`}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 id={`${menuId}-heading`} className="font-heading text-base font-semibold">
                MapAble apps
              </h2>
              <p className="text-xs text-muted-foreground">
                Open a MapAble service or support area.
              </p>
            </div>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3" role="list">
            {items.map((item) => (
              <div key={item.href} role="listitem">
                <AppTile
                  item={item}
                  active={isActive(item.href)}
                  onClick={() => setOpen(false)}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
