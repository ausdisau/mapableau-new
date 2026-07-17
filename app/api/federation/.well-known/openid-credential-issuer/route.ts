import { buildIssuerMetadata } from "@/lib/federation-conformance/oid4vci";
import { fedJson } from "@/lib/api/federation-response";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const publicOrigin =
    process.env.FEDERATION_PUBLIC_ORIGIN ?? `${url.protocol}//${url.host}`;
  const schemas = await prisma.credentialSchemaDefinition.findMany({
    where: { isActive: true },
    select: { schemaKey: true },
  });
  const metadata = buildIssuerMetadata({
    publicOrigin,
    schemaKeys: schemas.map((s) => s.schemaKey),
  });
  return fedJson(metadata);
}
