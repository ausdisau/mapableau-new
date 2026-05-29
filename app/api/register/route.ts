import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { bootstrapUserAfterRegister } from "@/lib/auth/register-bootstrap";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation/register";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid registration data" },
      { status: 400 }
    );
  }

  const { email, password, name, accountType } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    return NextResponse.json({ error: "Failed to register" }, { status: 400 });
  }

  const passwordHash = await hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      primaryRole: accountType === "support_worker" ? "support_worker" : "participant",
    },
  });

  const bootstrap = await bootstrapUserAfterRegister(
    user.id,
    name,
    accountType
  );

  return NextResponse.json({
    id: user.id,
    accountType: bootstrap.accountType,
    redirectTo: bootstrap.redirectTo,
  });
}
