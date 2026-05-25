import { registerBaseProfile } from "@/lib/auth/auth-service";
import { profileCreateSchema } from "@/lib/validation/core-schemas";
import { z } from "zod";

const bodySchema = profileCreateSchema.extend({
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid registration details", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const user = await registerBaseProfile({
      email: parsed.data.email,
      password: (json as { password: string }).password,
      name: parsed.data.name,
      phone: parsed.data.phone,
    });

    return Response.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "EMAIL_IN_USE") {
      return Response.json({ error: "Email already registered" }, { status: 409 });
    }
    return Response.json({ error: "Registration failed" }, { status: 500 });
  }
}
