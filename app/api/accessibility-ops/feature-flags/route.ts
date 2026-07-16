import {
  getAccessibilityOpsFeatureFlags,
  getAccessibilityOpsMode,
} from "@/lib/accessibility-ops/feature-flags";
import { probeAccessIntelligenceCompose } from "@/lib/accessibility-ops/compose/access-intelligence-adapter";
import { probeAuraCompose } from "@/lib/accessibility-ops/compose/aura-adapter";

export async function GET() {
  return Response.json({
    flags: getAccessibilityOpsFeatureFlags(),
    mode: getAccessibilityOpsMode(),
    compose: {
      accessIntelligence: probeAccessIntelligenceCompose(),
      aura: probeAuraCompose(),
    },
  });
}
