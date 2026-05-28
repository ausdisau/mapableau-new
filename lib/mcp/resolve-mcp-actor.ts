import type { CurrentUser } from "@/lib/auth/current-user";
import { userHasRole } from "@/lib/auth/current-user";
import { getDemoParticipantId } from "@/lib/mcp/config";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types/mapable";

function toCurrentUser(user: {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  timezone: string;
  locale: string;
  primaryRole: string;
  roleAssignments: { role: string }[];
}): CurrentUser {
  const roles: UserRole[] = [
    user.primaryRole as UserRole,
    ...user.roleAssignments.map((r) => r.role as UserRole),
  ];
  const uniqueRoles = [...new Set(roles)];
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    timezone: user.timezone,
    locale: user.locale,
    primaryRole: user.primaryRole as UserRole,
    roles: uniqueRoles,
  };
}

export function resolveMcpParticipantId(participantId?: string): string {
  return participantId?.trim() || getDemoParticipantId();
}

export async function resolveMcpProviderActor(): Promise<CurrentUser> {
  const explicitId = process.env.MAPABLE_MCP_DEMO_PROVIDER_USER_ID?.trim();
  if (explicitId) {
    const user = await prisma.user.findUnique({
      where: { id: explicitId },
      include: { roleAssignments: true },
    });
    if (user && userHasRole(toCurrentUser(user), "provider_admin")) {
      return toCurrentUser(user);
    }
    throw new Error(
      `MAPABLE_MCP_DEMO_PROVIDER_USER_ID user not found or not provider_admin.`,
    );
  }

  const user = await prisma.user.findFirst({
    where: { primaryRole: "provider_admin" },
    include: { roleAssignments: true },
    orderBy: { createdAt: "asc" },
  });

  if (!user) {
    throw new Error(
      "No provider_admin user in database. Set MAPABLE_MCP_DEMO_PROVIDER_USER_ID or seed demo data.",
    );
  }

  return toCurrentUser(user);
}
