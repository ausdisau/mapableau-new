import { AuraInferenceModeSelector } from "@/components/aura/AuraPocketPanel";

export default function AuraPocketSettingsPage() {
  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Pocket settings</h1>
      <AuraInferenceModeSelector value="no_ai" onChange={() => undefined} />
      <p className="text-sm text-gray-600">
        Native bridge: not connected (contract only). Web fallback active.
      </p>
    </main>
  );
}
