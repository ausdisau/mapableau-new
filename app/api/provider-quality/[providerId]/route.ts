import { jsonOk } from "@/lib/api/response";
import { getPublicQualitySignals } from "@/lib/provider-quality/provider-quality-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ providerId: string }> }
) {
  const { providerId } = await params;
  const signals = await getPublicQualitySignals(providerId);
  return jsonOk({
    signals,
    disclaimer: "These indicators are explainable summaries, not safety guarantees.",
  });
}
