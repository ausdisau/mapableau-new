import { GoRouteDetailClient } from "@/components/go/GoRouteDetailClient";
import { mapableGoFlags } from "@/lib/config/mapable-go";

export const metadata = {
  title: "MapAble Go | Your route",
};

export default async function GoRoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ routeId?: string }>;
}) {
  const { id } = await params;
  const { routeId } = await searchParams;

  if (!mapableGoFlags.enabled) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p>MapAble Go is not enabled.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Your route</h1>
      <GoRouteDetailClient planId={id} initialRouteId={routeId} />
    </main>
  );
}
