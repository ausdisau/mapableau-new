export type SlaParameterValue = string | number | boolean;
export type SlaParameters = Record<string, SlaParameterValue>;

export interface SelectedModule {
  moduleId: string;
  variantIds: string[];
}

export interface GenerateSlaInput {
  participantId?: string;
  participantPlanId?: string;
  selectedModules: SelectedModule[];
  customParameters?: SlaParameters;
}

export interface SlaVariantDefinition {
  moduleId: string;
  variantId: string;
  name: string;
  description: string;
  defaultParams: SlaParameters;
  clauseMarkdown: string;
}

export interface SlaModuleDefinition {
  moduleId: string;
  name: string;
  description: string;
  templateKey: string;
}

export interface SlaModuleOption extends SlaModuleDefinition {
  variants: Array<
    Pick<SlaVariantDefinition, "variantId" | "name" | "description" | "defaultParams">
  >;
}

export interface SlaTemplateSource {
  key: string;
  moduleId: string | null;
  contentMarkdown: string;
}

export interface SlaVariantSource {
  moduleId: string;
  variantId: string;
  name: string;
  defaultParams: string | null;
}

export interface RenderSlaInput {
  agreementReference: string;
  coreTemplate: SlaTemplateSource;
  moduleTemplates: SlaTemplateSource[];
  variants: SlaVariantSource[];
  selectedModules: SelectedModule[];
  parameters: SlaParameters;
}

export type ParticipantSlaStatus = "draft" | "active" | "superseded";
