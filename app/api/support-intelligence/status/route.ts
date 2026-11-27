import {
  hardDenyOperationalActions,
  isCapabilityEnabled,
  isSupportIntelligenceLive,
  supportIntelligenceFlags,
} from "@/lib/support-intelligence/config/feature-flags";

export const runtime = "nodejs";

/** GET /api/support-intelligence/status — capability matrix (no secrets). */
export async function GET() {
  return Response.json(
    {
      version: "0.1.0",
      live: isSupportIntelligenceLive(),
      flags: {
        enabled: supportIntelligenceFlags.enabled,
        killSwitch: supportIntelligenceFlags.killSwitch,
        spider: isCapabilityEnabled("spider"),
        spiderCrawl: supportIntelligenceFlags.spiderCrawlEnabled,
        sna: isCapabilityEnabled("sna"),
        sma: isCapabilityEnabled("sma"),
        regulatory: isCapabilityEnabled("regulatory"),
        workerVerification: isCapabilityEnabled("worker_verification"),
        demand: isCapabilityEnabled("demand"),
        search: isCapabilityEnabled("search"),
      },
      operationalActions: hardDenyOperationalActions(),
      safeguards: [
        "No unauthorised worker-screening database crawling",
        "No invented registration, vacancy or competency claims",
        "No AI determination of NDIS eligibility or funding",
        "No automated high-risk support authorisation",
        "No commercial influence over organic matching rankings",
        "No sensitive participant information in public search indexes",
        "Human review for regulatory conflicts, uncertain identity matches and complex support requirements",
      ],
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
