import { jsonOk } from "@/lib/api/response";

export const dynamic = "force-dynamic";

function enabled(name: string): boolean {
  return process.env[name] === "true";
}

/**
 * Public capability declaration for first-party MapAble native clients.
 *
 * This endpoint does not establish identity or grant access to protected APIs.
 * It lets a native build discover which server-side mobile foundations are
 * configured without turning planning intent into a live-capability claim.
 */
export async function GET() {
  return jsonOk({
    product: "MapAble" as const,
    tagline: "Empowering Independence",
    claimState: "capability-declaration" as const,
    auth: {
      sourceOfTruth: "nextauth-web" as const,
      nativeSessionExchange: enabled("MAPABLE_MOBILE_NATIVE_AUTH_ENABLED"),
    },
    realtime: {
      enabled: enabled("MAPABLE_MOBILE_REALTIME_ENABLED"),
      redisBackplaneConfigured: enabled("MAPABLE_MOBILE_REDIS_ENABLED"),
    },
    modules: {
      access: {
        publicSearch: true,
        requiresSession: false,
      },
      care: {
        requiresSession: true,
      },
      transport: {
        requiresSession: true,
      },
      jobs: {
        requiresSession: true,
      },
    },
  });
}
