import { randomBytes } from "node:crypto";

import { hash } from "bcryptjs";

import { prisma } from "@/lib/prisma";

/** OAuth users get an unusable password hash; they sign in via Google/Microsoft only. */
export async function findOrCreateOAuthUser({
  email,
  name,
}: {
  email: string;
  name: string;
}) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) return existing;

  const passwordHash = await hash(randomBytes(32).toString("hex"), 10);
  return prisma.user.create({
    data: {
      email: normalizedEmail,
      name: name.trim() || normalizedEmail.split("@")[0] || "MapAble user",
      passwordHash,
    },
  });
}
