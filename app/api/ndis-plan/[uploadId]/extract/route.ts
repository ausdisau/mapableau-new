import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { extractPlanFromDocument } from "@/lib/ndis-plan/ocr-adapter";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { uploadId } = await params;
  const upload = await prisma.ndisPlanUpload.findFirst({
    where: { id: uploadId, participantId: user.id },
  });
  if (!upload) return jsonError("Not found", 404);
  const extraction = await extractPlanFromDocument(upload.storageKey);
  await prisma.ndisPlanUpload.update({
    where: { id: uploadId },
    data: { extractionJson: extraction, status: "extracted" },
  });
  return jsonOk({ extraction });
}
