import { DIGITAL_TWIN_DEMO_BANNER } from "@/lib/digital-twin/constants";

export function DemoDataBanner() {
  return (
    <div
      role="status"
      className="rounded-lg border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"
    >
      <strong className="font-semibold">Demo data: </strong>
      {DIGITAL_TWIN_DEMO_BANNER}
    </div>
  );
}
