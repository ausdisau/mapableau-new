/**
 * Mapping of AURA controls to external control catalogues. Enough structure
 * for compliance evidence exports.
 */

export interface ControlMapping {
  auraControl: string;
  description: string;
  nistAiRmf?: string[];
  iso42001?: string[];
  ndisPracticeStandards?: string[];
}

export const AURA_CONTROL_MAP: ControlMapping[] = [
  {
    auraControl: "aura.authority.envelope_required",
    description: "No agent action without a live authority envelope.",
    nistAiRmf: ["Govern-1.5", "Manage-4.1"],
    iso42001: ["A.6.2.4"],
    ndisPracticeStandards: ["Rights of participants"],
  },
  {
    auraControl: "aura.plans.dag_only",
    description: "Plans are DAGs; unbounded loops rejected.",
    nistAiRmf: ["Measure-2.6"],
    iso42001: ["A.6.2.5"],
  },
  {
    auraControl: "aura.simulation.no_external_writes",
    description: "Simulation must produce zero external writes.",
    nistAiRmf: ["Measure-2.7"],
  },
  {
    auraControl: "aura.approvals.input_hash_bound",
    description: "Approvals bind the input hash.",
    nistAiRmf: ["Manage-4.2"],
  },
  {
    auraControl: "aura.memory.no_auto_from_model",
    description: "Model output cannot auto-write memory.",
    nistAiRmf: ["Govern-2.2"],
  },
  {
    auraControl: "aura.security.prompt_injection_isolated",
    description: "Untrusted content cannot grant authority.",
    nistAiRmf: ["Measure-2.7"],
  },
  {
    auraControl: "aura.protocols.mcp_pinned",
    description: "MCP servers pinned and conformance-tested.",
  },
  {
    auraControl: "aura.protocols.a2a_disabled_default",
    description: "A2A disabled by default.",
  },
  {
    auraControl: "aura.safety.holds_and_kill_switch",
    description: "Safety officers can pause AURA; agents cannot self-release.",
    nistAiRmf: ["Manage-2.4"],
  },
  {
    auraControl: "aura.outcomes.no_online_selfupdate",
    description: "No online self-update from outcome signals.",
    nistAiRmf: ["Govern-1.6"],
  },
];
