"use client";

import type { ReactNode } from "react";

import { InstallAppPrompt } from "@/components/pwa/InstallAppPrompt";
import { NetworkStatusProvider } from "@/components/pwa/NetworkStatusProvider";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

/** Client-only PWA shell: network status, offline banner, install prompt, SW */
export function PwaProviders({ children }: { children: ReactNode }) {
  return (
    <NetworkStatusProvider>
      <OfflineBanner />
      {children}
      <InstallAppPrompt />
      <ServiceWorkerRegister />
    </NetworkStatusProvider>
  );
}
