import { safeEnvSummary, validateProductionEnv } from "../lib/env";

const { ok, missing } = validateProductionEnv();

console.log("Environment summary (no secrets):");
console.log(safeEnvSummary());

if (process.env.NODE_ENV === "production" && !ok) {
  console.error("Missing required production variables:", missing.join(", "));
  process.exit(1);
}

console.log("Environment check passed.");
