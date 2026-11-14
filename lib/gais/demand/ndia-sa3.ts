import type { GaisDemandRegionMetric } from "@/lib/gais/demand/contracts";
import {
  calculateDemandStrategyIndex,
  classifyDemandContext,
} from "@/lib/gais/demand/metrics";

export type NdiaSa3Observation = {
  reportDate: string;
  state: string;
  regionCode: string;
  regionName: string;
  participantCount: number | null;
  suppressed: boolean;
};

const MONTHS: Record<string, string> = {
  JAN: "01",
  FEB: "02",
  MAR: "03",
  APR: "04",
  MAY: "05",
  JUN: "06",
  JUL: "07",
  AUG: "08",
  SEP: "09",
  OCT: "10",
  NOV: "11",
  DEC: "12",
};

function parseReportDate(value: string): string {
  const match = value.trim().toUpperCase().match(/^(\d{2})([A-Z]{3})(\d{4})$/);
  if (!match) throw new Error(`Unsupported NDIA report date: ${value}`);
  const [, day, monthName, year] = match;
  const month = MONTHS[monthName];
  if (!month) throw new Error(`Unsupported NDIA report month: ${monthName}`);
  return `${year}-${month}-${day}`;
}

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const next = csv[i + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }

  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((value) => value.length > 0)) rows.push(row);
  }

  return rows;
}

export function parseNdiaSa3Csv(csv: string): NdiaSa3Observation[] {
  const rows = parseCsvRows(csv);
  if (rows.length < 2) return [];

  const headers = rows[0].map((value) => value.trim());
  const index = (name: string) => headers.indexOf(name);
  const reportIndex = index("RprtDt");
  const stateIndex = index("StateCd");
  const codeIndex = index("SA3Cd2016");
  const nameIndex = index("SA3Nm2016");
  const countIndex = index("PrtcpntCnt");

  if ([reportIndex, stateIndex, codeIndex, nameIndex, countIndex].some((i) => i < 0)) {
    throw new Error("NDIA SA3 CSV is missing required columns");
  }

  return rows.slice(1).map((columns) => {
    const rawCount = columns[countIndex]?.trim() ?? "";
    const participantCount = /^\d+$/.test(rawCount) ? Number(rawCount) : null;
    return {
      reportDate: parseReportDate(columns[reportIndex] ?? ""),
      state: columns[stateIndex]?.trim() ?? "",
      regionCode: columns[codeIndex]?.trim() ?? "",
      regionName: columns[nameIndex]?.trim() ?? "",
      participantCount,
      suppressed: participantCount == null,
    };
  });
}

function daysBetween(a: string, b: string): number {
  return Math.abs(
    (Date.parse(a + "T00:00:00Z") - Date.parse(b + "T00:00:00Z")) / 86_400_000,
  );
}

export function buildLatestNdiaSa3Metrics(
  observations: NdiaSa3Observation[],
  sourceUrl = "https://dataresearch.ndis.gov.au/media/4241/download?attachment=",
): Map<string, GaisDemandRegionMetric> {
  const grouped = new Map<string, NdiaSa3Observation[]>();
  for (const observation of observations) {
    if (!observation.regionCode || observation.regionCode === "Other") continue;
    const current = grouped.get(observation.regionCode) ?? [];
    current.push(observation);
    grouped.set(observation.regionCode, current);
  }

  const result = new Map<string, GaisDemandRegionMetric>();
  for (const [regionCode, rows] of grouped) {
    const ordered = [...rows].sort((a, b) => b.reportDate.localeCompare(a.reportDate));
    const latest = ordered[0];
    if (!latest) continue;

    const candidates = ordered.slice(1).filter((row) => {
      const diff = daysBetween(latest.reportDate, row.reportDate);
      return diff >= 300 && diff <= 430;
    });
    const previous = candidates.sort(
      (a, b) =>
        Math.abs(daysBetween(latest.reportDate, a.reportDate) - 365) -
        Math.abs(daysBetween(latest.reportDate, b.reportDate) - 365),
    )[0];

    const previousCount = previous?.participantCount ?? null;
    const yoyGrowthPercent =
      latest.participantCount != null && previousCount != null && previousCount > 0
        ? ((latest.participantCount - previousCount) / previousCount) * 100
        : null;

    result.set(regionCode, {
      regionCode,
      regionName: latest.regionName,
      state: latest.state,
      participantCount: latest.participantCount,
      participantCountSuppressed: latest.suppressed,
      previousYearParticipantCount: previousCount,
      previousObservedAt: previous?.reportDate ?? null,
      yoyGrowthPercent,
      contextLabel: classifyDemandContext(latest.participantCount, yoyGrowthPercent),
      strategyIndex: calculateDemandStrategyIndex(latest.participantCount, yoyGrowthPercent),
      growthAvailable: yoyGrowthPercent != null,
      observedAt: latest.reportDate,
      evidence: {
        sourceOrganisation: "National Disability Insurance Agency",
        sourceUrl,
        geography: "SA3 2016",
        observedAt: latest.reportDate,
        claimState: "verified_public_source",
        limitations: [
          "Regional aggregate only; not an individual need, eligibility or service-availability measure.",
          "Small counts may be suppressed by the source and remain unknown in MapAble.",
        ],
      },
    });
  }

  return result;
}
