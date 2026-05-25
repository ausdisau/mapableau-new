import { createAccessPlace } from "@/lib/access-map/access-place-service";
import { prisma } from "@/lib/prisma";

export async function commitImportJob(jobId: string, actorId: string) {
  const job = await prisma.accessImportJob.findUnique({ where: { id: jobId } });
  if (!job) {
    throw new Error("IMPORT_JOB_NOT_FOUND");
  }
  if (job.status === "completed") {
    const metadata = job.metadata as { created?: number } | null;
    return { created: metadata?.created ?? 0, alreadyCommitted: true as const };
  }

  const items = await prisma.accessImportItem.findMany({
    where: { jobId, status: "pending", matchedPlaceId: null },
  });

  let created = 0;
  for (const item of items) {
    if (item.latitude == null || item.longitude == null) {
      await prisma.accessImportItem.update({
        where: { id: item.id },
        data: { status: "skipped" },
      });
      continue;
    }

    const place = await createAccessPlace({
      input: {
        name: item.name,
        category: (item.category as never) ?? "other",
        description: item.description ?? undefined,
        latitude: item.latitude,
        longitude: item.longitude,
        country: "AU",
      },
      createdById: actorId,
      status: "pending_moderation",
      sourceType: "imported",
      sourceReference: item.externalRef ?? item.id,
    });

    await prisma.accessPlaceSource.create({
      data: {
        placeId: place.id,
        sourceType: "uploaded_kml",
        externalId: item.externalRef ?? undefined,
      },
    });

    await prisma.accessImportItem.update({
      where: { id: item.id },
      data: { status: "accepted", matchedPlaceId: place.id },
    });
    created++;
  }

  await prisma.accessImportJob.update({
    where: { id: jobId },
    data: { status: "completed", metadata: { created } },
  });

  return { created };
}
