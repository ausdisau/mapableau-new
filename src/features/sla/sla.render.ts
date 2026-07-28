import {
  getModuleDefinition,
  getVariantDefinition,
  SLA_MODULES,
} from "./sla.templates";
import type {
  RenderSlaInput,
  SelectedModule,
  SlaParameters,
  SlaVariantSource,
} from "./sla.types";

const PLACEHOLDER = /{{\s*([a-zA-Z][a-zA-Z0-9]*)\s*}}/g;

export class SlaRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SlaRenderError";
  }
}

function markdownSafe(value: string): string {
  return value
    .replace(/\r?\n/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/([`*_[\]<>])/g, "\\$1")
    .trim();
}

export function renderMarkdownTemplate(
  template: string,
  parameters: SlaParameters,
  trustedMarkdownKeys: ReadonlySet<string> = new Set(),
): string {
  const missing = new Set<string>();
  const rendered = template.replace(PLACEHOLDER, (_match, key: string) => {
    const value = parameters[key];
    if (value === undefined || value === null || value === "") {
      missing.add(key);
      return "";
    }
    const text = String(value);
    return trustedMarkdownKeys.has(key) ? text : markdownSafe(text);
  });

  if (missing.size > 0) {
    throw new SlaRenderError(`Missing SLA parameters: ${[...missing].sort().join(", ")}`);
  }

  const unresolved = [...rendered.matchAll(PLACEHOLDER)].map((match) => match[1]);
  if (unresolved.length > 0) {
    throw new SlaRenderError(
      `Unresolved SLA placeholders: ${[...new Set(unresolved)].sort().join(", ")}`,
    );
  }

  return rendered.trim();
}

function parseDefaultParams(source: SlaVariantSource): SlaParameters {
  if (!source.defaultParams) return {};
  try {
    const parsed = JSON.parse(source.defaultParams) as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      throw new Error("expected an object");
    }
    return parsed as SlaParameters;
  } catch (error) {
    throw new SlaRenderError(
      `Invalid default parameters for ${source.variantId}: ${(error as Error).message}`,
    );
  }
}

function validateSelections(
  selections: SelectedModule[],
  variantsById: Map<string, SlaVariantSource>,
): void {
  if (selections.length === 0) {
    throw new SlaRenderError("Select at least one SLA module");
  }

  const moduleIds = new Set<string>();
  const variantIds = new Set<string>();
  for (const selection of selections) {
    if (moduleIds.has(selection.moduleId)) {
      throw new SlaRenderError(`Module selected more than once: ${selection.moduleId}`);
    }
    moduleIds.add(selection.moduleId);

    if (!getModuleDefinition(selection.moduleId)) {
      throw new SlaRenderError(`Unknown SLA module: ${selection.moduleId}`);
    }
    if (selection.variantIds.length === 0) {
      throw new SlaRenderError(`Select at least one variant for ${selection.moduleId}`);
    }

    for (const variantId of selection.variantIds) {
      if (variantIds.has(variantId)) {
        throw new SlaRenderError(`Variant selected more than once: ${variantId}`);
      }
      variantIds.add(variantId);
      const source = variantsById.get(variantId);
      if (!source || source.moduleId !== selection.moduleId) {
        throw new SlaRenderError(
          `Variant ${variantId} does not belong to module ${selection.moduleId}`,
        );
      }
      if (!getVariantDefinition(variantId)) {
        throw new SlaRenderError(`No server-side clause is defined for ${variantId}`);
      }
    }
  }
}

export function renderSlaDocument(input: RenderSlaInput): string {
  const variantsById = new Map(input.variants.map((variant) => [variant.variantId, variant]));
  validateSelections(input.selectedModules, variantsById);

  const selectedByModule = new Map(
    input.selectedModules.map((selection) => [selection.moduleId, selection]),
  );
  const moduleTemplates = new Map(
    input.moduleTemplates
      .filter((template) => template.moduleId)
      .map((template) => [template.moduleId!, template]),
  );

  const renderedModules: string[] = [];
  for (const module of SLA_MODULES) {
    const selection = selectedByModule.get(module.moduleId);
    if (!selection) continue;
    const template = moduleTemplates.get(module.moduleId);
    if (!template) {
      throw new SlaRenderError(`Missing template for module ${module.moduleId}`);
    }

    const moduleParams: SlaParameters = { ...input.parameters };
    const variantSections: string[] = [];
    for (const variantId of selection.variantIds) {
      const source = variantsById.get(variantId)!;
      const definition = getVariantDefinition(variantId)!;
      Object.assign(moduleParams, parseDefaultParams(source));
      variantSections.push(
        `### ${source.name}\n\n${renderMarkdownTemplate(definition.clauseMarkdown, {
          ...moduleParams,
          ...input.parameters,
        })}`,
      );
    }

    renderedModules.push(
      renderMarkdownTemplate(
        template.contentMarkdown,
        {
          ...moduleParams,
          ...input.parameters,
          variantSections: variantSections.join("\n\n"),
        },
        new Set(["variantSections"]),
      ),
    );
  }

  const core = renderMarkdownTemplate(input.coreTemplate.contentMarkdown, {
    ...input.parameters,
    agreementReference: input.agreementReference,
  });

  return `${core}\n\n${renderedModules.join("\n\n")}\n`;
}
