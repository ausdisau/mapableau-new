import { compare } from "bcryptjs";
import { afterEach, describe, expect, it } from "vitest";

import { POST } from "@/app/api/register/route";
import { prisma } from "@/lib/prisma";

const createdUserIds: string[] = [];

afterEach(async () => {
  while (createdUserIds.length > 0) {
    const id = createdUserIds.pop();
    if (id) {
      await prisma.user.delete({ where: { id } }).catch(() => undefined);
    }
  }
});

function registerRequest(body: Record<string, unknown>) {
  return POST(
    new Request("http://localhost/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/register (integration)", () => {
  const hasDb = Boolean(process.env.DATABASE_URL);

  it.skipIf(!hasDb)("persists a hashed password and rejects duplicate email", async () => {
    const email = `vitest-reg-${Date.now()}@mapable.test`;
    const password = "VitestReg123!";

    const first = await registerRequest({
      email,
      password,
      name: "Vitest Register",
    });
    expect(first.status).toBe(200);
    const { id } = (await first.json()) as { id: string };
    createdUserIds.push(id);

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user?.name).toBe("Vitest Register");
    expect(user?.primaryRole).toBe("participant");
    expect(await compare(password, user!.passwordHash)).toBe(true);

    const duplicate = await registerRequest({
      email,
      password,
      name: "Duplicate",
    });
    expect(duplicate.status).toBe(400);
    expect((await duplicate.json()).error).toBe("Failed to register");
  });
});
