#!/usr/bin/env npx tsx
/**
 * Ensures Provider directory tables exist and syncs outlet JSON + legacy users into Provider.
 */
import { execSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { Prisma } from "@prisma/client";

import { mapOutletToProvider } from "@/app/provider-finder/outletToProvider";
import type { ProviderOutlet } from "@/data/provider-outlets.types";
import { prisma } from "@/lib/prisma";
import { fetchLegacyProviderUsers } from "@/lib/provider-directory/legacy-provider-users";

async function ensureSchema() {
  const sqlPath = join(process.cwd(), "prisma/sql/ensure-provider-directory.sql");
  execSync(`npx prisma db execute --schema prisma/schema.prisma --file "${sqlPath}"`, {
    stdio: "inherit",
  });
}

async function upsertFromFinder(
  p: ReturnType<typeof mapOutletToProvider>,
  source: string,
) {
  const id = p.outletKey ?? p.id;
  await prisma.provider.upsert({
    where: { id },
    create: {
      id,
      name: p.name,
      slug: p.slug,
      outletKey: p.outletKey,
      source,
      website: p.website,
      email: p.email,
      phone: p.phone,
      abn: p.abn,
      ndisRegistered: p.registered,
      rating: p.rating,
      reviewCount: p.reviewCount,
      specialisations: p.categories,
      locations: {
        create: {
          address: `${p.suburb} ${p.state} ${p.postcode}`.trim(),
          city: p.suburb === "—" ? null : p.suburb,
          state: p.state,
          postcode: p.postcode || null,
          country: "AU",
          latitude: p.latitude ?? null,
          longitude: p.longitude ?? null,
        },
      },
    },
    update: {
      name: p.name,
      slug: p.slug,
      outletKey: p.outletKey,
      source,
      website: p.website,
      email: p.email,
      phone: p.phone,
      abn: p.abn,
      ndisRegistered: p.registered,
      rating: p.rating,
      reviewCount: p.reviewCount,
      specialisations: p.categories,
      updatedAt: new Date(),
    },
  });

  const existingLoc = await prisma.serviceLocation.findFirst({
    where: { providerId: id },
  });
  const locData = {
    address: `${p.suburb} ${p.state} ${p.postcode}`.trim(),
    city: p.suburb === "—" ? null : p.suburb,
    state: p.state,
    postcode: p.postcode || null,
    country: "AU",
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
  };
  if (existingLoc) {
    await prisma.serviceLocation.update({
      where: { id: existingLoc.id },
      data: locData,
    });
  } else {
    await prisma.serviceLocation.create({
      data: { ...locData, providerId: id },
    });
  }
}

async function main() {
  const syncOutlets = process.argv.includes("--outlets");
  const outletLimit = Number(
    process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "0",
  );

  console.log("Ensuring Provider directory schema…");
  await ensureSchema();
  console.log("Regenerating Prisma client…");
  execSync("npx prisma generate", { stdio: "inherit" });

  if (syncOutlets) {
    const path = join(process.cwd(), "public", "data", "provider-outlets.json");
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw) as { data?: ProviderOutlet[] };
    let outlets = Array.isArray(parsed.data) ? parsed.data : [];
    outlets = outlets.filter((o) => o.Active === 1);
    if (outletLimit > 0) outlets = outlets.slice(0, outletLimit);

    console.log(`Syncing ${outlets.length} active outlet records…`);
    let outletCount = 0;
    for (let i = 0; i < outlets.length; i++) {
      const mapped = mapOutletToProvider(outlets[i], i);
      await upsertFromFinder(mapped, "outlet_json");
      outletCount++;
      if (outletCount % 500 === 0) {
        console.log(`  …${outletCount} outlets`);
      }
    }
  } else {
    console.log(
      "Skipping outlet JSON (pass --outlets [--limit=N] to sync NDIS outlets into Provider).",
    );
  }

  const legacy = await fetchLegacyProviderUsers();
  console.log(`Syncing ${legacy.length} legacy provider users…`);
  for (const p of legacy) {
    await upsertFromFinder(p, "legacy_user");
  }

  const total = await prisma.provider.count();
  console.log(`Done. Provider table row count: ${total}`);
}

main()
  .catch((e) => {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(e.code, e.message);
    } else {
      console.error(e);
    }
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
