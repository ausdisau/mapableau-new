import { getCurrentUser } from "@/lib/auth/current-user";

export async function auth() {
  const user = await getCurrentUser();
  if (!user) return null;
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.primaryRole,
    },
  };
}
