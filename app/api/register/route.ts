import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { email, password, name } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  // todo: return generic error so we don't leak information
  if (existing) {
    return NextResponse.json({ error: "Failed to register" }, { status: 400 });
  }

  const passwordHash = await hash(password, 10); // 10 is the salt rounds

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: passwordHash,
    },
  });

  return NextResponse.json({ id: user.id });
}
