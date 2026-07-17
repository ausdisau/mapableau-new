import { AuraPresentationModeSelector } from "@/components/aura/AuraPocketPanel";

export default function AuraCommunicationPage() {
  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Adaptive communication</h1>
      <p>Standard text is always available. Symbol mode is optional.</p>
      <AuraPresentationModeSelector value="standard" onChange={() => undefined} />
      <ol className="list-decimal pl-5">
        <li>Go to Entrance B.</li>
        <li>Enter through the level doorway.</li>
        <li>Use the western lift.</li>
      </ol>
    </main>
  );
}
