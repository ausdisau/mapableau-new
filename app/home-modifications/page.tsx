import Link from "next/link";

import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";
import { HomeModificationProviderDirectory } from "@/components/home-modifications/HomeModificationProviderDirectory";
import { requireAuth } from "@/lib/auth/guards";
import { listHomeModificationProviders } from "@/lib/home-modifications/home-modification-service";
import { prisma } from "@/lib/prisma";

export default async function HomeModificationsPage() {
  const user = await requireAuth();
  const [providers, requests] = await Promise.all([
    listHomeModificationProviders(),
    prisma.homeModificationRequest.findMany({
      where: { participantId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { projects: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
      <header>
        <h1 className="font-heading text-2xl font-bold md:text-3xl">
          Home modifications
        </h1>
        <p className="mt-2 text-muted-foreground">
          Coordinate accessible home changes with assessments, quotes and milestones.
        </p>
      </header>

      <Link
        href="/home-modifications/request"
        className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 py-2 text-primary-foreground"
      >
        Start a new request
      </Link>

      <MapAbleCard title="Your requests">
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No requests yet.</p>
        ) : (
          <ul className="space-y-2">
            {requests.map((r) => (
              <li key={r.id}>
                <Link href={`/home-modifications/projects/${r.projects[0]?.id ?? r.id}`} className="text-primary underline">
                  {r.title} — {r.status}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </MapAbleCard>

      <HomeModificationProviderDirectory providers={providers} />
    </div>
  );
}
