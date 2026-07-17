/**
 * Configurable regulatory deadlines — not hard-coded in UI.
 */
export type RegulatoryDeadlineConfig = {
  potentiallyReportableHours: number;
  reportableHours: number;
  acknowledgementHours: number;
};

export const DEFAULT_REGULATORY_DEADLINE_CONFIG: RegulatoryDeadlineConfig = {
  potentiallyReportableHours: 24,
  reportableHours: 24,
  acknowledgementHours: 4,
};

export function computeRegulatoryDeadlines(input: {
  occurredAt: Date;
  config?: RegulatoryDeadlineConfig;
}): {
  acknowledgementDueAt: Date;
  potentiallyReportableDueAt: Date;
  reportableDueAt: Date;
} {
  const config = input.config ?? DEFAULT_REGULATORY_DEADLINE_CONFIG;
  const ms = (h: number) => h * 60 * 60 * 1000;
  return {
    acknowledgementDueAt: new Date(
      input.occurredAt.getTime() + ms(config.acknowledgementHours)
    ),
    potentiallyReportableDueAt: new Date(
      input.occurredAt.getTime() + ms(config.potentiallyReportableHours)
    ),
    reportableDueAt: new Date(
      input.occurredAt.getTime() + ms(config.reportableHours)
    ),
  };
}
