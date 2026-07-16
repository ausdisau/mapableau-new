import { NextResponse } from "next/server";

import { verifyCredentialPublic } from "@/lib/academy/credentials/credential-service";

type Params = { params: Promise<{ publicId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { publicId } = await params;
  const result = await verifyCredentialPublic(publicId);
  if (!result) {
    return NextResponse.json({ error: "Credential not found" }, { status: 404 });
  }
  return NextResponse.json({ credential: result });
}
