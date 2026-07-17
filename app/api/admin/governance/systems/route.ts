import {
  getAdminSystemsRoute,
  postAdminSystemsRoute,
} from "@/lib/public-interest-governance/route-handlers";

export const dynamic = "force-dynamic";

export const GET = getAdminSystemsRoute;
export const POST = postAdminSystemsRoute;
