import type { LabExperimentStatus } from "@/lib/labs/contracts";

const STATUS_LABELS: Record<LabExperimentStatus, string> = {
  DEMONSTRATION: "Demonstration",
  CO_DESIGN: "Co-design",
  PRODUCT_RESEARCH: "Product research",
  FORMAL_RESEARCH: "Formal research",
};

export function ExperimentStatusBadge({
  status,
  environmentMode = "SIMULATION",
}: {
  status: LabExperimentStatus;
  environmentMode?: "SIMULATION";
}) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Experiment status">
      <span className="rounded-full border border-[#F8C51C]/40 bg-[#F8C51C]/15 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#F8C51C]">
        {STATUS_LABELS[status]}
      </span>
      <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70">
        {environmentMode}
      </span>
      <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-white/55">
        Labs simulation data
      </span>
    </div>
  );
}
