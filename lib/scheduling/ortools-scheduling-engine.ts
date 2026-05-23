import { NotConfiguredSchedulingEngine } from "@/lib/scheduling/scheduling-engine";

export const ortoolsSchedulingEngine = new NotConfiguredSchedulingEngine(
  "ortools",
  "OR-Tools"
);
