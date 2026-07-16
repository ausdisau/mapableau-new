import { jsonOk } from "@/lib/api/response";
import {
  careIntelligenceConfigFromEnv,
  careIntelligenceHealth,
} from "@/lib/care-intelligence/config";
import { CSI_KERNEL_CAPABILITIES } from "@/lib/care-intelligence/kernel/capabilities";
import { CSI_AGI_KERNEL_VERSION } from "@/lib/care-intelligence/kernel/kernel";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return jsonOk({
    health: careIntelligenceHealth(careIntelligenceConfigFromEnv()),
    kernel: {
      version: CSI_AGI_KERNEL_VERSION,
      registeredCapabilities: CSI_KERNEL_CAPABILITIES.length,
      sideEffectCapabilities: 0,
    },
  });
}
