import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  handleAssessNeeds,
  handleCopilotPlan,
  handleGetCapabilities,
  handlePlanCareShift,
  handleSearchWorkers,
} from "@/lib/mcp/handlers";
import { MAPABLE_RESULT_WIDGET_URI } from "@/lib/mcp/tool-results";
import { readWidgetHtml } from "@/lib/mcp/widget-html";

const DRAFT_ONLY =
  "Draft/plan only — confirm in MapAble. Does not assign workers or save records.";

export function registerMapableChatgptTools(server: McpServer) {
  server.registerResource(
    "mapable_result_card",
    MAPABLE_RESULT_WIDGET_URI,
    {
      description: "MapAble result summary card with link to complete in browser",
      mimeType: "text/html",
    },
    async () => ({
      contents: [
        {
          uri: MAPABLE_RESULT_WIDGET_URI,
          mimeType: "text/html",
          text: readWidgetHtml(),
        },
      ],
    } as const),
  );

  server.tool(
    "mapable_get_capabilities",
    "List MapAble ChatGPT tools, governance rules, and deep-link paths. Read-only.",
    {},
    async () => handleGetCapabilities(),
  );

  server.tool(
    "mapable_copilot_plan",
    `Classify intent and plan Co-Pilot actions with guardrails. ${DRAFT_ONLY}`,
    {
      query: z.string().describe("Participant or provider question"),
      mode: z
        .string()
        .optional()
        .describe("Co-Pilot mode: All, Support, Transport, NDIS, Jobs, Help"),
      participantId: z
        .string()
        .optional()
        .describe("Participant id; defaults to demo participant"),
    },
    async ({ query, mode, participantId }) =>
      handleCopilotPlan({ query, mode, participantId }),
  );

  server.tool(
    "mapable_search_workers",
    `Search and rank workers/providers for a support need. ${DRAFT_ONLY}`,
    {
      query: z.string().describe("Describe the support need and preferences"),
      participantId: z
        .string()
        .optional()
        .describe("Participant id for needs-informed filters"),
    },
    async ({ query, participantId }) =>
      handleSearchWorkers({ query, participantId }),
  );

  server.tool(
    "mapable_assess_needs",
    `Run participant needs assessment (profile + gaps + recommendations). ${DRAFT_ONLY}`,
    {
      query: z
        .string()
        .optional()
        .describe("Optional focus for the assessment"),
      participantId: z
        .string()
        .optional()
        .describe("Participant id; defaults to demo participant"),
    },
    async ({ query, participantId }) =>
      handleAssessNeeds({ query, participantId }),
  );

  server.tool(
    "mapable_plan_care_shift",
    `Plan a care shift for a provider booking (worker, times, eligibility). ${DRAFT_ONLY}`,
    {
      query: z
        .string()
        .describe("Natural language shift request, e.g. assign worker and times"),
      careBookingId: z
        .string()
        .optional()
        .describe("Care booking id when known"),
    },
    async ({ query, careBookingId }) =>
      handlePlanCareShift({ query, careBookingId }),
  );
}

export function createMapableMcpServer() {
  const server = new McpServer({
    name: "mapable-chatgpt",
    version: "1.0.0",
    websiteUrl: process.env.MAPABLE_PUBLIC_URL ?? "https://www.mapable.com.au",
  });
  registerMapableChatgptTools(server);
  return server;
}
