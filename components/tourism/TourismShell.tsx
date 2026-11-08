"use client";

import type { ReactNode } from "react";

import { PrototypeBanner } from "@/components/tourism/PrototypeBanner";
import { TourismNav } from "@/components/tourism/TourismNav";

export function TourismShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#F6FBFC] text-[#0C1833]">
      <PrototypeBanner />
      <TourismNav />
      {children}
    </div>
  );
}
