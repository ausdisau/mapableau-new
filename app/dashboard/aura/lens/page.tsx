export default function AuraLensPage() {
  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Spatial Access Lens</h1>
      <p>
        Spatial capture output is provisional and not assessor verification. Manual
        measurement is always available.
      </p>
      <form className="space-y-4" aria-label="Manual measurement">
        <label>
          Doorway clear width (mm)
          <input type="number" className="ml-2 border rounded px-2" name="widthMm" />
        </label>
        <button type="submit" className="rounded bg-blue-700 px-4 py-2 text-white">
          Record measurement
        </button>
      </form>
    </main>
  );
}
