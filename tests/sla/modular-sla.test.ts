import { describe, expect, it } from "vitest";
import { renderSlaDocument } from "@/src/features/sla/sla.render";
import {
  SLA_CORE_TEMPLATE_KEY,
  SLA_MODULES,
  SLA_TEMPLATE_SEEDS,
  SLA_VARIANTS,
} from "@/src/features/sla/sla.templates";
import type {
  RenderSlaInput,
  SelectedModule,
} from "@/src/features/sla/sla.types";

function input(selectedModules: SelectedModule[]): RenderSlaInput {
  const coreTemplate = SLA_TEMPLATE_SEEDS.find(
    (template) => template.key === SLA_CORE_TEMPLATE_KEY,
  );
  if (!coreTemplate) throw new Error("Core test template missing");

  return {
    agreementReference: "MAP-AG-2026-TEST0001",
    coreTemplate,
    moduleTemplates: SLA_TEMPLATE_SEEDS.filter((template) => template.moduleId),
    variants: SLA_VARIANTS.map((variant) => ({
      moduleId: variant.moduleId,
      variantId: variant.variantId,
      name: variant.name,
      defaultParams: JSON.stringify(variant.defaultParams),
    })),
    selectedModules,
    parameters: {
      agreementReference: "MAP-AG-2026-TEST0001",
      participantName: "Taylor Example",
      ndisNumber: "431234567",
      agreementDate: "2026-07-28",
      planStartDate: "2026-01-01",
      planEndDate: "2026-12-31",
      careNoticeHours: 72,
      careCancellationHours: 48,
      careResponseHours: 4,
      transportNoticeHours: 24,
      transportCancellationHours: 12,
      transportWaitMinutes: 10,
      employmentNoticeHours: 24,
      employmentReviewWeeks: 6,
      trainingNoticeHours: 48,
      trainingCancellationHours: 48,
    },
  };
}

describe("modular SLA catalogue", () => {
  it("defines the four modules and twelve variants", () => {
    expect(SLA_MODULES.map((module) => module.moduleId)).toEqual([
      "care",
      "transport",
      "employment",
      "training",
    ]);
    expect(SLA_VARIANTS).toHaveLength(12);
  });
});

describe("renderSlaDocument", () => {
  it("assembles core terms and selected modules in canonical order", () => {
    const markdown = renderSlaDocument(
      input([
        { moduleId: "transport", variantIds: ["transport-standard"] },
        { moduleId: "care", variantIds: ["care-standard"] },
      ]),
    );

    expect(markdown).toContain("# MapAble Service Level Agreement");
    expect(markdown).toContain("Taylor Example");
    expect(markdown).toContain("### Standard Care");
    expect(markdown).toContain("### Standard Transport");
    expect(markdown).toContain("not an emergency service");
    expect(markdown).toContain("call `000`");
    expect(markdown.indexOf("Module A")).toBeLessThan(
      markdown.indexOf("Module B"),
    );
    expect(markdown).not.toMatch(/\{\{[^}]+\}\}/);
  });

  it("includes every selected variant", () => {
    const markdown = renderSlaDocument(
      input([
        {
          moduleId: "care",
          variantIds: ["care-standard", "care-priority", "care-complex"],
        },
      ]),
    );

    expect(markdown).toContain("### Standard Care");
    expect(markdown).toContain("### Priority Care");
    expect(markdown).toContain("### Specialist / Complex Care");
  });

  it("rejects unknown modules and cross-module variants", () => {
    expect(() =>
      renderSlaDocument(
        input([{ moduleId: "unknown", variantIds: ["care-standard"] }]),
      ),
    ).toThrow("Unknown SLA module");

    expect(() =>
      renderSlaDocument(
        input([{ moduleId: "care", variantIds: ["transport-standard"] }]),
      ),
    ).toThrow("does not belong to module care");
  });

  it("rejects duplicate modules and variants", () => {
    expect(() =>
      renderSlaDocument(
        input([
          { moduleId: "care", variantIds: ["care-standard"] },
          { moduleId: "care", variantIds: ["care-priority"] },
        ]),
      ),
    ).toThrow("selected more than once");

    expect(() =>
      renderSlaDocument(
        input([
          {
            moduleId: "care",
            variantIds: ["care-standard", "care-standard"],
          },
        ]),
      ),
    ).toThrow("selected more than once");
  });

  it("fails closed when a template parameter is unresolved", () => {
    const renderInput = input([
      { moduleId: "transport", variantIds: ["transport-standard"] },
    ]);
    delete renderInput.parameters.transportWaitMinutes;
    const variant = renderInput.variants.find(
      (candidate) => candidate.variantId === "transport-standard",
    );
    if (!variant) throw new Error("Transport test variant missing");
    const defaults = JSON.parse(variant.defaultParams ?? "{}") as Record<
      string,
      unknown
    >;
    delete defaults.transportWaitMinutes;
    variant.defaultParams = JSON.stringify(defaults);

    expect(() => renderSlaDocument(renderInput)).toThrow(
      "Missing SLA parameters: transportWaitMinutes",
    );
  });
});
