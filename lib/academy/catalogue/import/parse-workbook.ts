import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { extname } from "node:path";

import ExcelJS from "exceljs";

import {
  LEVEL_MAP,
  PUBLICATION_STATUS_MAP,
  WAVE_MAP,
  type NormalizedCourseRow,
  type NormalizedSchoolRow,
} from "@/lib/academy/catalogue/import/constants";

function cellStr(value: ExcelJS.CellValue | undefined): string {
  if (value == null) return "";
  if (typeof value === "object" && "text" in value && typeof value.text === "string") {
    return value.text.trim();
  }
  if (typeof value === "object" && "result" in value) {
    return String(value.result ?? "").trim();
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  return String(value).trim();
}

function sheetToObjects(ws: ExcelJS.Worksheet, headerRow = 3): Record<string, string>[] {
  const headerCells = ws.getRow(headerRow).values as ExcelJS.CellValue[];
  const headers: string[] = [];
  for (let i = 1; i < headerCells.length; i++) {
    headers[i] = cellStr(headerCells[i]);
  }
  const rows: Record<string, string>[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRow) return;
    const obj: Record<string, string> = { __rowNumber: String(rowNumber) };
    let empty = true;
    for (let i = 1; i < headers.length; i++) {
      const key = headers[i];
      if (!key) continue;
      const v = cellStr(row.getCell(i).value);
      obj[key] = v;
      if (v) empty = false;
    }
    if (!empty) rows.push(obj);
  });
  return rows;
}

function normalizeBoolYes(raw: string): boolean {
  const s = raw.toLowerCase();
  return s.startsWith("yes");
}

function normalizePublicationStatus(raw: string) {
  const key = raw.toLowerCase().replace(/\s+/g, " ").trim();
  return PUBLICATION_STATUS_MAP[key] as NormalizedCourseRow["publicationStatus"] | undefined;
}

function normalizeLevel(raw: string) {
  return LEVEL_MAP[raw.toLowerCase()] as NormalizedCourseRow["level"] | undefined;
}

function normalizeWave(raw: string) {
  const key = raw.toLowerCase().replace(/\s+/g, " ").trim();
  return WAVE_MAP[key] as NormalizedCourseRow["releaseWave"] | undefined;
}

function parseTags(raw: string): string[] {
  return raw
    .split(/;|,/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function workbookChecksum(filePath: string): string {
  const buf = readFileSync(filePath);
  return createHash("sha256").update(buf).digest("hex");
}

export type ParsedWorkbook = {
  schools: NormalizedSchoolRow[];
  courses: NormalizedCourseRow[];
  checksum: string;
  sourceFilename: string;
};

type JsonWorkbook = {
  pathways: Record<string, string | number>[];
  cursorSeed: Record<string, string | number>[];
  courseCatalogue: Record<string, string | number>[];
};

function str(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function normalizeFromRows(
  pathwayRows: Record<string, string>[],
  seedRows: Record<string, string>[],
  catalogueRows: Record<string, string>[],
  meta: { checksum: string; sourceFilename: string },
): ParsedWorkbook {
  const schools: NormalizedSchoolRow[] = pathwayRows.map((r, idx) => ({
    code: r["School Code"] || "",
    name: r["Academy School"] || "",
    courseCount: Number(r["Course Count"] || 0),
    primaryAudience: r["Primary Audience"] || "",
    pathwayBadge: r["Pathway Badge"] || "",
    purpose: r["Purpose"] || "",
    releasePriority: r["Release Priority"] || "",
    displayOrder: idx + 1,
  }));

  const catalogueByCode = new Map<string, Record<string, string>>();
  for (const row of catalogueRows) {
    const code = row["Course Code"];
    if (code) catalogueByCode.set(code, row);
  }

  const courses: NormalizedCourseRow[] = seedRows.map((seed, idx) => {
    const code = seed.courseCode || "";
    const cat = catalogueByCode.get(code) ?? {};
    const level = normalizeLevel(seed.level || cat.Level || "");
    const wave = normalizeWave(seed.releaseWave || cat["Release Wave"] || "");
    const status = normalizePublicationStatus(
      seed.publicationStatus || cat.Status || "Planned",
    );
    const duration = Number(seed.durationMinutes || cat["Duration (min)"] || 0);

    return {
      courseCode: code,
      schoolCode: seed.schoolCode || "",
      title: seed.title || cat["Course Title"] || "",
      audience: seed.audience || cat["Primary Audience"] || "",
      level: level ?? ("FOUNDATION" as const),
      durationMinutes: duration,
      deliveryFormat: seed.deliveryFormat || cat["Delivery Format"] || "",
      assessmentType: seed.assessmentType || cat.Assessment || "",
      credentialType: seed.credentialType || cat.Credential || "",
      reviewCycle: seed.reviewCycle || cat["Suggested Review Cycle"] || "",
      releaseWave: wave ?? ("WAVE_1_LAUNCH" as const),
      ndisTags: parseTags(seed.ndisTags || cat["NDIS / Framework Tags"] || ""),
      sourceUrl: seed.sourceUrl || cat["Authoritative Source URL"] || "",
      disclaimer: seed.disclaimer || cat["Governance Note"] || "",
      publicationStatus: status ?? "PLANNED",
      practicalAssessmentRequired: normalizeBoolYes(
        cat["Practical Assessment Required"] || "",
      ),
      clinicalReviewRequired: normalizeBoolYes(cat["Clinical Review Required"] || ""),
      disabilityLedReviewRequired: /required/i.test(
        cat["Disability-Led Review"] || "Required",
      ),
      pathwayBadge: cat["Pathway Badge"] || null,
      indicativeLearningOutcome: cat["Indicative Learning Outcome"] || null,
      governanceNote: cat["Governance Note"] || null,
      schoolName: cat.School || null,
      rowNumber: Number(seed.__rowNumber || idx + 4),
    };
  });

  return { schools, courses, ...meta };
}

function parseJsonWorkbook(filePath: string): ParsedWorkbook {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as JsonWorkbook;
  const pathwayRows = raw.pathways.map((r) =>
    Object.fromEntries(Object.entries(r).map(([k, v]) => [k, str(v)])),
  );
  const seedRows = raw.cursorSeed.map((r, i) => ({
    ...Object.fromEntries(Object.entries(r).map(([k, v]) => [k, str(v)])),
    __rowNumber: String(i + 4),
  }));
  const catalogueRows = raw.courseCatalogue.map((r) =>
    Object.fromEntries(Object.entries(r).map(([k, v]) => [k, str(v)])),
  );
  return normalizeFromRows(pathwayRows, seedRows, catalogueRows, {
    checksum: workbookChecksum(filePath),
    sourceFilename: filePath.split("/").pop() ?? filePath,
  });
}

async function parseXlsxWorkbook(filePath: string): Promise<ParsedWorkbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const pathwaysWs = workbook.getWorksheet("Pathways");
  const seedWs = workbook.getWorksheet("Cursor Seed");
  const catalogueWs = workbook.getWorksheet("Course Catalogue");
  if (!pathwaysWs || !seedWs || !catalogueWs) {
    throw new Error("Workbook missing required sheets: Pathways, Cursor Seed, Course Catalogue");
  }
  return normalizeFromRows(
    sheetToObjects(pathwaysWs),
    sheetToObjects(seedWs),
    sheetToObjects(catalogueWs),
    {
      checksum: workbookChecksum(filePath),
      sourceFilename: filePath.split("/").pop() ?? filePath,
    },
  );
}

/**
 * Parse the committed JSON projection or an .xlsx workbook.
 * Prefer `data/academy/catalogue-workbook.json` in CI — exceljs cannot read every xlsx variant.
 */
export async function parseCatalogueWorkbook(filePath: string): Promise<ParsedWorkbook> {
  const ext = extname(filePath).toLowerCase();
  if (ext === ".json") {
    return parseJsonWorkbook(filePath);
  }
  try {
    return await parseXlsxWorkbook(filePath);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to parse Excel workbook (${message}). Use the version-controlled JSON projection: data/academy/catalogue-workbook.json (regenerate via scripts/export-academy-catalogue-json.py).`,
    );
  }
}
