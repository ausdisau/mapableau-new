"use client";

import Link from "next/link";
import React from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { FictionalBanner } from "@/components/access-intelligence/physical/fictional-banner";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

const links = [
  {
    href: "/access-intelligence/physical/passport",
    title: "Passport",
    body: "Select power-chair or other named passports for planning.",
  },
  {
    href: "/access-intelligence/physical/plan",
    title: "Concierge plan",
    body: "Deterministic fit, text route, unknowns, and approval-gated actions.",
  },
  {
    href: "/access-intelligence/physical/scout",
    title: "Scout",
    body: "Review provisional perception candidates as an accessible list.",
  },
  {
    href: "/access-intelligence/physical/visits",
    title: "Visit plans",
    body: "Saved Harbour visit plans for print and revisit.",
  },
  {
    href: "/access-intelligence/physical/actions",
    title: "Actions",
    body: "Action Gateway history with live-region state updates.",
  },
  {
    href: "/access-intelligence/physical/simulator",
    title: "Simulator",
    body: "Inject lift outages, door faults, and emergency mode.",
  },
  {
    href: "/venue/access-intelligence",
    title: "Venue Ops Console",
    body: "Operator view for devices, emergency, and venue approvals.",
  },
];

export function PhysicalHubClient() {
  return (
    <AccessIntelligenceShell
      title="Access Intelligence · Physical Systems"
      description="Harbour Civic Centre vertical slice: Scout, Concierge, Action Gateway, Simulator, and Venue Ops — simulated production behaviour with live actuation off by default."
    >
      <FictionalBanner />
      <ul className="grid gap-4 md:grid-cols-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className={`block rounded-2xl border border-slate-200 bg-gradient-to-br from-[#F6FBFC] to-white p-5 transition hover:border-[#005B7F] ${mapableCareFocusRing}`}
            >
              <p className="text-lg font-black text-[#0C1833]">{l.title}</p>
              <p className="mt-2 text-sm text-slate-600">{l.body}</p>
            </Link>
          </li>
        ))}
      </ul>
    </AccessIntelligenceShell>
  );
}
