import { GoRoutePlanner } from "@/components/go/GoRoutePlanner";
import { mapableGoFlags } from "@/lib/config/mapable-go";
import { listPublishedPlaces } from "@/lib/access/map/access-place-service";

export const metadata = {
  title: "MapAble Go | Accessible journey planner",
  description:
    "Plan power-wheelchair accessible routes with evidence, uncertainty labels, and participant control.",
};

export default async function GoPage() {
  if (!mapableGoFlags.enabled) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold">MapAble Go</h1>
        <p className="mt-4 text-muted-foreground">
          MapAble Go is not enabled in this environment. This capability remains in development
          behind feature flags.
        </p>
      </main>
    );
  }

  const places = await listPublishedPlaces(200);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">MapAble Go</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Accessible journey planning for power-wheelchair users. Compare route options with
          evidence and uncertainty — you choose which route to take.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Claim state: IN_DEVELOPMENT. Pilot sandbox graph — not live national path evidence.
        </p>
      </header>
      <GoRoutePlanner
        initialPlaces={places.map((p) => ({
          id: p.id,
          name: p.name,
          suburb: p.suburb,
          latitude: p.location?.latitude,
          longitude: p.location?.longitude,
        }))}
      />
    </main>
  );
}
