export default function AuraPocketOfflinePage() {
  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Offline data</h1>
      <p role="status">
        Mission snapshots are stored in a user-scoped namespace. Sensitive data is
        not stored in plain localStorage.
      </p>
      <button type="button" className="rounded border px-4 py-2">
        Delete offline data
      </button>
    </main>
  );
}
