import { describe, expect, it } from "vitest";

import { renderAgentResponse } from "@/lib/mapable-agent/response-renderer";

describe("renderAgentResponse", () => {
  it("hides reasoning by default", () => {
    const rendered = renderAgentResponse({
      text: "Here is your answer.",
      reasoningSummary: "Internal reasoning",
    });
    expect(rendered.text).toBe("Here is your answer.");
    expect(rendered.showReasoning).toBe(false);
  });

  it("can show reasoning when opted in", () => {
    const rendered = renderAgentResponse(
      { text: "Answer", reasoningSummary: "Because plan intent" },
      { showReasoning: true },
    );
    expect(rendered.showReasoning).toBe(true);
    expect(rendered.reasoningSummary).toBeDefined();
  });
});
