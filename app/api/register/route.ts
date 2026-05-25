import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureUserProfileAfterAuth } from "@/lib/auth/create-or-link-profile";
import {
  BLOCKED_SELF_REGISTRATION_ROLES,
  mapRegistrationTypeToPrimaryRole,
} from "@/lib/auth/registration-roles";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  accountType: z.enum([
    "participant",
    "nominee_or_carer",
    "provider",
    "support_worker",
    "driver",
    "support_coordinator",
    "plan_manager",
  ]),
  acceptedTerms: z.boolean().refine((v) => v === true, {
    message: "Terms must be accepted",
  }),
});

export async function POST(req: Request) {
  let body: z.infer<typeof registerSchema>;
  try {
    body = registerSchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Please check your details and try again." },
      { status: 400 },
    );
  }

  const email = body.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "We could not create your account. Try signing in instead." },
      { status: 400 },
    );
  }

  const primaryRole = mapRegistrationTypeToPrimaryRole(body.accountType);
  if (BLOCKED_SELF_REGISTRATION_ROLES.includes(primaryRole)) {
    return NextResponse.json(
      { error: "This account type cannot be self-registered." },
      { status: 400 },
    );
  }

  const passwordHash = await hash(body.password, 10);

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email,
      passwordHash,
      primaryRole,
    },
  });

  await ensureUserProfileAfterAuth(user.id, primaryRole);

  return NextResponse.json({ id: user.id, primaryRole });
}
