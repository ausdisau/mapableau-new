import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import {
  logAuthEvent,
  requestAuditContext,
} from "@/lib/audit/auth-audit-service";
import { normalizeAuthProvider } from "@/lib/auth/auth-provider";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  provider: z.enum(["google", "microsoft"]),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const audit = requestAuditContext(request.headers);
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const provider = normalizeAuthProvider(
    body.provider === "microsoft" ? "azure-ad" : "google",
  );

  const links = await prisma.authIdentityLink.findMany({
    where: { userId: session.user.id },
  });

  const oauthLinks = links.filter(
    (l) => l.provider === "google" || l.provider === "microsoft",
  );

  const target = oauthLinks.find((l) => l.provider === provider);
  if (!target) {
    return NextResponse.json(
      { error: "That sign-in method is not linked." },
      { status: 404 },
    );
  }

  if (links.length <= 1) {
    return NextResponse.json(
      {
        error:
          "Keep at least one sign-in method. Link another provider or use email sign-in before removing this one.",
      },
      { status: 400 },
    );
  }

  await prisma.authIdentityLink.delete({ where: { id: target.id } });

  await logAuthEvent({
    eventType: "provider_unlinked",
    userId: session.user.id,
    provider,
    ipAddress: audit.ipAddress,
    userAgent: audit.userAgent,
  });

  return NextResponse.json({ ok: true });
}
