import { getMapablePublicUrl } from "@/lib/mcp/config";
import type { MapableDeepLinks } from "@/lib/mcp/deep-links";

export const MAPABLE_RESULT_WIDGET_URI = "ui://mapable/result-card";

export type MapableToolPayload = {
  summary: string;
  data: Record<string, unknown>;
  deepLinks: MapableDeepLinks;
  widgetUri?: string;
  widgetState?: Record<string, unknown>;
};

export function formatToolResult(payload: MapableToolPayload) {
  const body = {
    governance:
      "Draft/plan only — confirm bookings, assignments, and record changes in MapAble.",
    publicUrl: getMapablePublicUrl(),
    summary: payload.summary,
    deepLinks: payload.deepLinks,
    ...payload.data,
  };

  const meta: Record<string, unknown> = {
    "openai/outputTemplate": payload.widgetUri ?? MAPABLE_RESULT_WIDGET_URI,
    widgetState: payload.widgetState ?? {
      summary: payload.summary,
      primaryUrl:
        payload.deepLinks.shiftCreatorUrl ??
        payload.deepLinks.workerSearchUrl ??
        payload.deepLinks.assessmentUrl ??
        payload.deepLinks.askUrl,
    },
  };

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(body, null, 2),
      },
    ],
    structuredContent: body,
    _meta: meta,
  };
}
