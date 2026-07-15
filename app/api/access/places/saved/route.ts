import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const saveSchema = z.object({
  placeId: z.string().min(1),
});

/**
 * Save / bookmark an Access place.
 * Requires authenticated session. Create only when user has profile consent
 * or explicitly confirms via shareAccessProfile-style acknowledge in UI.
 */
export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const place = await prisma.accessPlace.findFirst({
    where: { id: parsed.data.placeId, status: "published" },
    select: { id: true },
  });
  if (!place) return jsonError("Place not found", 404);

  const saved = await prisma.accessSavedPlace.upsert({
    where: {
      userId_placeId: {
        userId: user.id,
        placeId: place.id,
      },
    },
    create: {
      userId: user.id,
      placeId: place.id,
    },
    update: {},
  });

  return jsonOk({ id: saved.id, placeId: place.id, saved: true });
}

export async function DELETE(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const placeId = url.searchParams.get("placeId");
  if (!placeId) return jsonError("placeId is required", 400);

  await prisma.accessSavedPlace.deleteMany({
    where: { userId: user.id, placeId },
  });

  return jsonOk({ placeId, saved: false });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return jsonError("Sign in to view saved places", 401);

  const rows = await prisma.accessSavedPlace.findMany({
    where: { userId: session.user.id },
    include: {
      place: {
        select: {
          id: true,
          name: true,
          category: true,
          suburb: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return jsonOk({
    places: rows.map((r) => ({
      id: r.id,
      placeId: r.placeId,
      name: r.place.name,
      category: r.place.category,
      suburb: r.place.suburb,
      savedAt: r.createdAt.toISOString(),
    })),
  });
}
