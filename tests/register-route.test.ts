import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockHash = vi.fn(async (password: string) => `hashed:${password}`);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  hash: (...args: unknown[]) => mockHash(...args),
}));

import { POST } from "@/app/api/register/route";

function registerRequest(body: Record<string, unknown>) {
  return POST(
    new Request("http://localhost/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when email or password is missing", async () => {
    const res = await registerRequest({ email: "only@mapable.test" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Missing fields");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 when email is already registered", async () => {
    mockFindUnique.mockResolvedValue({ id: "existing-user" });

    const res = await registerRequest({
      email: "taken@mapable.test",
      password: "Secret1!",
      name: "Taken",
    });

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Failed to register");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("creates a user and returns the new id", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: "new-user-id" });

    const res = await registerRequest({
      email: "new@mapable.test",
      password: "Secret1!",
      name: "New User",
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "new-user-id" });
    expect(mockHash).toHaveBeenCalledWith("Secret1!", 10);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        name: "New User",
        email: "new@mapable.test",
        passwordHash: "hashed:Secret1!",
      },
    });
  });
});
