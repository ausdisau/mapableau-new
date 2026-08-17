import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { canAccessDocument } from "@/lib/documents/document-service";
import { prisma } from "@/lib/prisma";
import {
  guessDocumentMime,
  storeDocumentFile,
  validateUpload,
} from "@/lib/storage/documents";
import { StorageError } from "@/lib/storage/errors";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const docs = await prisma.document.findMany({
    where: {
      deletedAt: null,
      OR: [
        { uploadedById: user.id },
        { participantId: user.id },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const visible = [];
  for (const doc of docs) {
    if (
      await canAccessDocument(user.id, user.primaryRole, doc)
    ) {
      visible.push({
        ...doc,
        fileKey: undefined,
        storedAssetId: undefined,
      });
    }
  }
  return jsonOk({ documents: visible });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const ip = getClientIp(req);
  if (!checkIpRateLimit(`document-upload:${user.id}:${ip}`, { windowMs: 60_000, max: 10 })) {
    return jsonError("Too many upload requests", 429);
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return jsonError("file required");

  const buffer = Buffer.from(await file.arrayBuffer());
  const validation = validateUpload(guessDocumentMime(file.name), buffer.length);
  if (validation) return jsonError(validation);

  const organisationId = (form.get("organisationId") as string) || null;
  const participantId = (form.get("participantId") as string) || user.id;
  const visibility = (form.get("visibility") as string) || "private_to_participant";

  let stored;
  try {
    stored = await storeDocumentFile(buffer, file.name, {
      uploadedById: user.id,
      participantId,
      organisationId,
      organisationIdFromClient: Boolean(organisationId),
      visibility,
    });
  } catch (error) {
    if (error instanceof StorageError) {
      return jsonError(error.message, error.status);
    }
    throw error;
  }

  const doc = await prisma.document.create({
    data: {
      title: (form.get("title") as string) || file.name,
      category: (form.get("category") as never) || "other",
      visibility: visibility as never,
      fileKey: stored.fileKey,
      mimeType: stored.mimeType,
      fileSize: stored.fileSize,
      scanStatus: stored.scanStatus ?? "not_configured",
      storedAssetId: stored.storedAssetId ?? null,
      uploadedById: user.id,
      participantId,
      organisationId,
      bookingId: (form.get("bookingId") as string) || null,
      supportTicketId: (form.get("supportTicketId") as string) || null,
      description: (form.get("description") as string) || null,
    },
  });

  await createAuditEvent({
    actorUserId: user.id,
    actorRole: user.primaryRole as never,
    action: "document.uploaded",
    entityType: "Document",
    entityId: doc.id,
    participantId: doc.participantId ?? undefined,
  });

  return jsonOk({ document: { ...doc, fileKey: undefined, storedAssetId: undefined } }, 201);
}
