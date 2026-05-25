import { explainSignal } from "@/lib/provider-quality/quality-explanation-service";

export function QualitySignalExplanation({ category }: { category: string }) {
  return <p className="text-sm text-muted-foreground">{explainSignal(category)}</p>;
}
