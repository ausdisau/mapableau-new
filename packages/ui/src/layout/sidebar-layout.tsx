"use client";

import type { ReactNode } from "react";

import { cn } from "../lib/cn";

export interface SidebarNavItem {
  href: string;
  label: string;
  icon?: ReactNode;
  active?: boolean;
}

export interface SidebarLayoutProps {
  sidebar: ReactNode;
  mobileNav?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SidebarLayout({
  sidebar,
  mobileNav,
  header,
  children,
  className,
}: SidebarLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-white", className)} data-testid="mapable-sidebar-layout">
      {header}
      <div className="mx-auto flex max-w-7xl">
        <aside
          className="hidden w-56 shrink-0 border-r border-slate-200 bg-[#F6FBFC] md:block"
          aria-label="Primary navigation"
          data-testid="mapable-sidebar"
        >
          <div className="sticky top-0 p-4">{sidebar}</div>
        </aside>
        <main
          id="main-content"
          className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8 pb-20 md:pb-8"
        >
          {children}
        </main>
      </div>
      {mobileNav}
    </div>
  );
}

export interface SidebarNavProps {
  items: SidebarNavItem[];
  renderLink: (item: SidebarNavItem) => ReactNode;
}

export function SidebarNav({ items, renderLink }: SidebarNavProps) {
  return (
    <nav aria-label="Dashboard">
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.href}>{renderLink(item)}</li>
        ))}
      </ul>
    </nav>
  );
}

export function sidebarNavLinkClass(active: boolean): string {
  return cn(
    "flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F8C51C]",
    active
      ? "bg-[#005B7F]/10 text-[#005B7F]"
      : "text-slate-600 hover:bg-white hover:text-[#005B7F]",
  );
}
