import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { renderSlaDocument, SlaRenderError } from "../../src/features/sla/sla.render";
import {
  SLA_CORE_TEMPLATE_KEY,
  SLA_MODULES,
  SLA_TEMPLATE_SEEDS,
  SLA_VARIANTS,
} from "../../src/features/sla/sla.templates";

function sources() {
  const coreTemplate = SLA_TEMPLATE_SEEDS.find(
    (template) => template.key === SLA_CORE_TEMPLATE_KEY,
  )!;
  const moduleTemplates = SLA_TEMPLATE_SEEDS.filter(
    (template) => template.type === "module",
  );
  const variants = SLA_VARIANTS.map((variant) => ({
    moduleId: variant.moduleId,
    variantId: variant.variantId,
    name: variant.name,
    defaultParams: JSON.stringify(variant.defaultParams),
  }));
  return { coreTemplate, moduleTemplates, variants };
}

const parameters = {
  participantName: "Alex Example",
  ndisNumber: "430000001",
  planStartDate: "2026-01-01",
  planEndDate: "2026-12-31",
  agreementDate: "2026-07-28",
};

describe("modular SLA rendering", () => {
  test("catalogue exposes four modules and twelve variants", () => {
    assert.equal(SLA_MODULES.length, 4);
    assert.equal(SLA_VARIANTS.length, 12);
    for (const module of SLA_MODULES) {
      assert.equal(
        SLA_VARIANTS.filter((variant) => variant.moduleId === module.moduleId).length,
        3,
      );
    }
  });

  test("assembles core terms and selected modules into a complete snapshot", () => {
    const markdown = renderSlaDocument({
      agreementReference: "MAP-AG-2026-TEST0001",
      ...sources(),
      selectedModules: [
        { moduleId: "care", variantIds: ["care-priority"] },
        { moduleId: "transport", variantIds: ["transport-accessible"] },
      ],
      parameters: {
        ...parameters,
        careNoticeHours: 12,
      },
    });

    assert.match(markdown, /MAP-AG-2026-TEST0001/);
    assert.match(markdown, /Alex Example/);
    assert.match(markdown, /Module A – Care & Support Services/);
    assert.match(markdown, /### Priority Care/);
    assert.match(markdown, /12 hours' notice/);
    assert.match(markdown, /### Accessible \/ Specialist Transport/);
    assert.match(markdown, /participant directs their supports/i);
    assert.match(markdown, /will not retaliate/i);
    assert.match(markdown, /NDIS Quality and Safeguards Commission/);
    assert.match(markdown, /not an emergency service/i);
    assert.match(markdown, /call `000`/);
    assert.match(markdown, /authenticated acceptance/i);
    assert.doesNotMatch(markdown, /{{[^}]+}}/);
  });

  test("rejects a variant assigned to the wrong module", () => {
    assert.throws(
      () =>
        renderSlaDocument({
          agreementReference: "MAP-AG-2026-TEST0002",
          ...sources(),
          selectedModules: [
            { moduleId: "care", variantIds: ["transport-standard"] },
          ],
          parameters,
        }),
      (error: unknown) =>
        error instanceof SlaRenderError &&
        /does not belong to module care/.test(error.message),
    );
  });

  test("escapes participant-supplied Markdown control characters", () => {
    const markdown = renderSlaDocument({
      agreementReference: "MAP-AG-2026-TEST0003",
      ...sources(),
      selectedModules: [
        { moduleId: "training", variantIds: ["training-standard"] },
      ],
      parameters: {
        ...parameters,
        participantName: "Alex *Injected* <script>",
      },
    });

    assert.match(markdown, /Alex \\\*Injected\\\* \\<script\\>/);
    assert.doesNotMatch(markdown, /Alex \*Injected\* <script>/);
  });
});
