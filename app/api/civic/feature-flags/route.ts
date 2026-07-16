import { getCivicFeatureFlags, getCivicMode } from "@/lib/civic-access/feature-flags";

export async function GET() {
  return Response.json({
    flags: getCivicFeatureFlags(),
    mode: getCivicMode(),
  });
}
