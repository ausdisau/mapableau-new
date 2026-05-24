/**
 * Import NDIS Provider Finder registry into Prisma `Provider` (+ locations & services).
 *
 * Data source (same schema):
 * https://www.ndis.gov.au/sites/default/files/react_extract/provider_finder/build/data/list-providers.json
 *
 * Default local copy: public/data/provider-outlets.json
 *
 * Usage:
 *   pnpm seed:ndis-providers
 *   pnpm seed:ndis-providers -- --fresh
 *   pnpm seed:ndis-providers -- --limit 100
 *   pnpm seed:ndis-providers -- --download
 */
import { PrismaClient } from "@prisma/client";

import { aggregateOutletsByAbn } from "@/lib/ndis-provider-import/aggregate";
import { loadNdisProviderList } from "@/lib/ndis-provider-import/load";
import { stableProviderId } from "@/lib/ndis-provider-import/parse-location";

const prisma = new PrismaClient();

const BUSINESS_TYPE = "ndis_registry";
const BATCH_SIZE = 50;

function parseArgs(argv: string[]) {
  return {
    fresh: argv.includes("--fresh"),
    download: argv.includes("--download"),
    limit: (() => {
      const i = argv.indexOf("--limit");
      if (i === -1 || !argv[i + 1]) return undefined;
      const n = Number(argv[i + 1]);
      return Number.isFinite(n) && n > 0 ? n : undefined;
    })(),
    file: (() => {
      const i = argv.indexOf("--file");
      return i === -1 ? undefined : argv[i + 1];
    })(),
  };
}

async function removeExistingRegistryProviders() {
  const deleted = await prisma.provider.deleteMany({
    where: { businessType: BUSINESS_TYPE },
  });
  console.log(`Removed ${deleted.count} existing ndis_registry providers.`);
}

async function seedBatch(
  batch: ReturnType<typeof aggregateOutletsByAbn>
) {
  for (const p of batch) {
    const id = stableProviderId(p.abn);
    await prisma.provider.upsert({
      where: { id },
      create: {
        id,
        name: p.name,
        abn: p.abn,
        businessType: BUSINESS_TYPE,
        description:
          "Imported from NDIS Provider Finder (list-providers.json). Outlets aggregated by ABN.",
        email: p.email,
        phone: p.phone,
        website: p.website,
        ndisRegistered: p.ndisRegistered,
        ndisNumber: p.abn,
        serviceAreas: p.serviceAreas,
        specialisations: p.specialisations,
        services: {
          create: p.services.map((s) => ({
            name: s.name,
            description: s.description,
          })),
        },
        locations: {
          create: p.locations.map((loc) => ({
            address: loc.address,
            city: loc.city,
            state: loc.state,
            postcode: loc.postcode,
            country: loc.country,
          })),
        },
      },
      update: {
        name: p.name,
        abn: p.abn,
        email: p.email,
        phone: p.phone,
        website: p.website,
        ndisRegistered: p.ndisRegistered,
        ndisNumber: p.abn,
        serviceAreas: p.serviceAreas,
        specialisations: p.specialisations,
      },
    });

    await prisma.service.deleteMany({ where: { providerId: id } });
    if (p.services.length > 0) {
      await prisma.service.createMany({
        data: p.services.map((s) => ({
          providerId: id,
          name: s.name,
          description: s.description,
        })),
      });
    }

    await prisma.serviceLocation.deleteMany({ where: { providerId: id } });
    if (p.locations.length > 0) {
      await prisma.serviceLocation.createMany({
        data: p.locations.map((loc) => ({
          providerId: id,
          address: loc.address,
          city: loc.city,
          state: loc.state,
          postcode: loc.postcode,
          country: loc.country,
        })),
      });
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log("Loading NDIS provider list…");
  const file = await loadNdisProviderList({
    filePath: args.file,
    download: args.download,
  });
  console.log(
    `Source date: ${file.date ?? "unknown"} — ${file.data.length} outlet rows`
  );

  if (args.fresh) {
    await removeExistingRegistryProviders();
  }

  let aggregated = aggregateOutletsByAbn(file.data);
  if (args.limit) {
    aggregated = aggregated.slice(0, args.limit);
    console.log(`Limited to ${aggregated.length} providers (--limit).`);
  } else {
    console.log(`Aggregated ${aggregated.length} providers by ABN.`);
  }

  let done = 0;
  for (let i = 0; i < aggregated.length; i += BATCH_SIZE) {
    const batch = aggregated.slice(i, i + BATCH_SIZE);
    await seedBatch(batch);
    done += batch.length;
    if (done % 500 === 0 || done === aggregated.length) {
      console.log(`  Seeded ${done} / ${aggregated.length} providers…`);
    }
  }

  console.log("NDIS provider import complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
