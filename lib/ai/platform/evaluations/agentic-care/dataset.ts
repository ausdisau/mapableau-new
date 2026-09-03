import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  parseAgenticCareRow,
  type AgenticCareEvalItem,
  type AgenticCareSplit,
} from "./schema";

const SPLITS: AgenticCareSplit[] = ["dev", "test", "redteam"];

export async function loadAgenticCareDataset(options?: {
  rootDir?: string;
  split?: AgenticCareSplit;
}): Promise<AgenticCareEvalItem[]> {
  const rootDir = options?.rootDir ?? path.join(process.cwd(), "evals", "agentic-care", "dataset");
  const splits = options?.split ? [options.split] : SPLITS;
  const items: AgenticCareEvalItem[] = [];
  const seen = new Set<string>();

  for (const split of splits) {
    const filePath = path.join(rootDir, `${split}.jsonl`);
    const text = await readFile(filePath, "utf8");
    const lines = text.split(/\r?\n/);

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index]?.trim();
      if (!line) continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(line);
      } catch {
        throw new Error(`${filePath}:${index + 1}: invalid JSON`);
      }

      let row;
      try {
        row = parseAgenticCareRow(parsed);
      } catch {
        throw new Error(`${filePath}:${index + 1}: row does not match Agentic Care eval schema`);
      }

      if (row.item.split !== split) {
        throw new Error(`${filePath}:${index + 1}: item split does not match file split`);
      }
      if (seen.has(row.item.case_id)) {
        throw new Error(`${filePath}:${index + 1}: duplicate case_id ${row.item.case_id}`);
      }
      seen.add(row.item.case_id);
      items.push(row.item);
    }
  }

  return items;
}
