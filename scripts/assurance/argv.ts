import { parseArgs } from "node:util";

export type AssuranceScriptArgs = {
  dryRun: boolean;
  organisationId?: string;
  positionals: string[];
};

/** Filters `--` from argv and supports --dry-run with allowPositionals. */
export function parseAssuranceArgv(argv = process.argv.slice(2)): AssuranceScriptArgs {
  const filtered = argv.filter((a) => a !== "--");
  const { values, positionals } = parseArgs({
    args: filtered,
    options: {
      "dry-run": { type: "boolean", default: false },
      organisationId: { type: "string" },
    },
    allowPositionals: true,
    strict: false,
  });

  return {
    dryRun: Boolean(values["dry-run"]),
    organisationId:
      typeof values.organisationId === "string" ? values.organisationId : undefined,
    positionals,
  };
}
