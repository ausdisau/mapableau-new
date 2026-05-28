import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { registerCommunityMember } from "@/lib/community-governance-membership/membership-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const members = await prisma.communityGovernanceMembership.findMany();
  return jsonOk({ members });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const member = await registerCommunityMember(body);
  return jsonOk({ member }, 201);
}
