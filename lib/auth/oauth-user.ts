import { randomBytes } from "crypto";

import { hash } from "bcryptjs";

import { bootstrapUserAfterRegister } from "@/lib/auth/register-bootstrap";
import { prisma } from "@/lib/prisma";

/**
 * Links an OAuth sign-in to a MapAble User by email.
 * Creates a participant account with profiles when the email is new.
 */
export async function findOrCreateUserFromOAuth(params: {
  email: string;
  name: string;
}) {
  const email = params.email.trim().toLowerCase();
  const name = params.name.trim() || email;

  const existing = await prisma.user.findUnique({
    where: { email },
  });
  if (existing) return existing;

  const passwordHash = await hash(randomBytes(32).toString("hex"), 10);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name,
        passwordHash,
        primaryRole: "participant",
      },
    });

    await bootstrapUserAfterRegister(user.id, name, "participant", tx);

    return user;
  });
}
