export default function AuraGuardianPage() {
  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Journey Guardian</h1>
      <p role="status">
        Participant-controlled mission monitor. Cannot rebook transport or notify
        supporters automatically.
      </p>
      <button type="button" className="rounded border px-4 py-2">
        Enable monitoring
      </button>
      <button type="button" className="rounded border px-4 py-2 ml-2">
        Stop monitoring
      </button>
    </main>
  );
}
