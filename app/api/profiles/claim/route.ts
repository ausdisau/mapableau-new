import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { auth } from "@/app/lib/auth";
import { mapOutletsToProviders } from "@/app/provider-finder/outletToProvider";
import type { ProviderOutlet } from "@/data/provider-outlets.types";
import { prisma } from "@/lib/prisma";
import { parseProviderOutletsPayload } from "@/lib/provider-outlets";

const PROVIDER_OUTLET_FILES = ["provider-outlets.json", "provider-outlets2.json"];

async function readProviderOutlets(): Promise<ProviderOutlet[]> {
  let lastError: unknown;

  for (const fileName of PROVIDER_OUTLET_FILES) {
    try {
      const path = join(process.cwd(), "public", "data", fileName);
      return parseProviderOutletsPayload(JSON.parse(await readFile(path, "utf-8")));
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Provider outlets file not found");
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { outletKey: string };
  try {
    body = (await request.json()) as { outletKey: string };
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { outletKey } = body;
  if (!outletKey || typeof outletKey !== "string") {
    return Response.json(
      { error: "outletKey is required" },
      { status: 400 },
    );
  }

  const outlets = await readProviderOutlets();
  const providers = mapOutletsToProviders(outlets);
  const provider = providers.find((p) => p.outletKey === outletKey);

  if (!provider) {
    return Response.json(
      { error: "Outlet not found" },
      { status: 404 },
    );
  }

  const existing = await prisma.claimedProvider.findUnique({
    where: { outletKey },
  });
  if (existing) {
    return Response.json(
      { error: "This outlet has already been claimed" },
      { status: 409 },
    );
  }

  const slugConflict = await prisma.claimedProvider.findUnique({
    where: { slug: provider.slug },
  });
  const slug = slugConflict
    ? `${provider.slug}-${Date.now().toString(36)}`
    : provider.slug;

  const claimed = await prisma.claimedProvider.create({
    data: {
      slug,
      outletKey,
      userId: session.user.id,
      name: provider.name,
      phone: provider.phone ?? null,
      email: provider.email ?? null,
      website: provider.website ?? null,
      openingHours: provider.openingHours ?? null,
      suburb: provider.suburb !== "—" ? provider.suburb : null,
      state: provider.state ?? null,
      postcode: provider.postcode ?? null,
      categories: provider.categories,
      verifiedAt: new Date(),
    },
  });

  return Response.json({
    success: true,
    claimedProviderId: claimed.id,
    slug: claimed.slug,
  });
}
