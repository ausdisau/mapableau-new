import type { PriceRow } from "@/types/ndis-pricing";

const HEADER_ALIASES: Record<string, keyof PriceRow | "serviceTypes" | "providerTypes"> = {
  code: "code",
  "support item number": "code",
  "support item": "code",
  "item number": "code",
  name: "name",
  "support item name": "name",
  description: "name",
  price: "priceCapCents",
  "price limit": "priceCapCents",
  "price cap": "priceCapCents",
  "national price limit": "priceCapCents",
  unittype: "unitType",
  unit: "unitType",
  "unit of measure": "unitType",
  category: "category",
  "support category": "category",
  registrationgroup: "registrationGroup",
  "registration group": "registrationGroup",
  servicetypes: "serviceTypes",
  "service types": "serviceTypes",
  providertypes: "providerTypes",
  "provider types": "providerTypes",
};

function parsePriceToCents(raw: string): number | undefined {
  const cleaned = raw.replace(/[$,\s]/g, "").trim();
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  if (Number.isNaN(n)) return undefined;
  if (cleaned.includes(".") || n < 1000) return Math.round(n * 100);
  return Math.round(n);
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function mapHeader(cell: string): keyof PriceRow | "serviceTypes" | "providerTypes" | null {
  const key = cell.toLowerCase().trim();
  return HEADER_ALIASES[key] ?? null;
}

export function parseCsvToPriceRows(csvText: string): PriceRow[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const headerCells = splitCsvLine(lines[0]);
  const columnMap = headerCells.map(mapHeader);
  const hasHeader = columnMap.some(Boolean);
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const rows: PriceRow[] = [];
  for (const line of dataLines) {
    const cells = splitCsvLine(line);
    const row: Partial<PriceRow> & {
      serviceTypes?: string[];
      providerTypes?: string[];
    } = {};

    if (hasHeader) {
      cells.forEach((cell, i) => {
        const field = columnMap[i];
        if (!field) return;
        if (field === "priceCapCents") {
          row.priceCapCents = parsePriceToCents(cell);
        } else if (field === "serviceTypes" || field === "providerTypes") {
          row[field] = cell
            .split(/[|;]/)
            .map((s) => s.trim())
            .filter(Boolean);
        } else {
          row[field] = cell;
        }
      });
    } else if (cells.length >= 2) {
      row.code = cells[0];
      row.name = cells[1];
      if (cells[2]) row.priceCapCents = parsePriceToCents(cells[2]);
      if (cells[3]) row.unitType = cells[3];
      if (cells[4]) row.category = cells[4];
    }

    if (row.code && row.name) {
      rows.push({
        code: row.code.trim(),
        name: row.name.trim(),
        priceCapCents: row.priceCapCents,
        unitType: row.unitType,
        category: row.category,
        registrationGroup: row.registrationGroup,
        serviceTypes: row.serviceTypes,
        providerTypes: row.providerTypes,
      });
    }
  }
  return rows;
}
