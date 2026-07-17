import Link from "next/link";

import { AuraInferenceModeSelector, AuraPocketStatus } from "@/components/aura/AuraPocketPanel";

export default function AuraPocketPage() {
  return (
    <main className="mx-auto max-w-2xl p-6 space-y-8">
      <h1 className="text-2xl font-bold">AURA Pocket</h1>
      <p>
        Privacy-oriented mission runtime for offline viewing, local processing, and
        participant-controlled sync.
      </p>
      <AuraPocketStatus />
      <AuraInferenceModeSelector value="local_only" onChange={() => undefined} />
      <nav className="flex gap-4 text-sm">
        <Link href="/dashboard/aura/pocket/settings">Settings</Link>
        <Link href="/dashboard/aura/pocket/offline">Offline data</Link>
        <Link href="/dashboard/aura/lens">Spatial lens</Link>
        <Link href="/dashboard/aura/communication">Communication</Link>
      </nav>
    </main>
  );
}
