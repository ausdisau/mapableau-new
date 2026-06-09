"use client";

import Link from "next/link";

import type { Y1WedgeUxPath } from "@/lib/pilot/y1-wedge-pilot";

export function Y1WedgePilotNav({ paths }: { paths: Y1WedgeUxPath[] }) {
  if (paths.length === 0) return null;

  return (
    <nav aria-label="Trust wedge pilot" className="rounded-xl border border-border bg-card p-4">
      <h2 className="font-heading text-lg font-semibold">Trust wedge pilot</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your cohort has access to explainable matching and continuity recovery.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {paths.map((path) => (
          <li key={path.key}>
            <Link
              href={path.href}
              className="block rounded-lg border border-border p-3 hover:border-primary/40 hover:bg-muted/30"
            >
              <span className="font-medium">{path.label}</span>
              <p className="mt-1 text-sm text-muted-foreground">
                {path.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
