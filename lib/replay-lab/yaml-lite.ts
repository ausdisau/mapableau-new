/**
 * Minimal indentation-based YAML subset parser for Replay Lab scenarios.
 * Supports: nested maps, sequences (`-`), quoted/unquoted strings, numbers, booleans, null.
 */

export type YamlValue =
  | null
  | boolean
  | number
  | string
  | YamlValue[]
  | { [key: string]: YamlValue };

type Line = { raw: string; indent: number; content: string; n: number };

function prepareLines(source: string): Line[] {
  return source.split(/\r?\n/).flatMap((raw, i) => {
    if (/^\s*#/.test(raw) || raw.trim() === "") return [];
    const indent = raw.match(/^ */)![0].length;
    return [{ raw, indent, content: raw.trim(), n: i + 1 }];
  });
}

function parseScalar(raw: string): YamlValue {
  if (raw === "null" || raw === "~") return null;
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (raw === "[]") return [];
  if (raw === "{}") return {};
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1);
  }
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  return raw;
}

export function parseYamlLite(source: string): YamlValue {
  const lines = prepareLines(source);
  let i = 0;

  function parseValue(minIndent: number): YamlValue {
    if (i >= lines.length) return null;
    const line = lines[i]!;
    if (line.indent < minIndent) return null;
    if (line.content.startsWith("- ")) return parseSeq(line.indent);
    return parseMap(line.indent);
  }

  function parseMap(indent: number): Record<string, YamlValue> {
    const obj: Record<string, YamlValue> = {};
    while (i < lines.length) {
      const line = lines[i]!;
      if (line.indent < indent) break;
      if (line.indent > indent) {
        throw new Error(`YAML indent error at line ${line.n}`);
      }
      if (line.content.startsWith("- ")) break;

      const colonIdx = line.content.indexOf(":");
      if (colonIdx < 0) throw new Error(`YAML expected key at line ${line.n}`);
      const key = line.content.slice(0, colonIdx).trim();
      const inline = line.content.slice(colonIdx + 1).trim();
      i += 1;

      if (inline !== "") {
        obj[key] = parseScalar(inline);
        continue;
      }

      if (i >= lines.length || lines[i]!.indent <= indent) {
        obj[key] = null;
        continue;
      }

      const childIndent = lines[i]!.indent;
      if (lines[i]!.content.startsWith("- ")) {
        obj[key] = parseSeq(childIndent);
      } else {
        obj[key] = parseMap(childIndent);
      }
    }
    return obj;
  }

  function parseSeq(indent: number): YamlValue[] {
    const arr: YamlValue[] = [];
    while (i < lines.length) {
      const line = lines[i]!;
      if (line.indent < indent) break;
      if (line.indent > indent) {
        throw new Error(`YAML sequence indent error at line ${line.n}`);
      }
      if (!line.content.startsWith("- ")) break;

      const rest = line.content.slice(2).trim();
      i += 1;

      if (rest === "") {
        if (i < lines.length && lines[i]!.indent > indent) {
          arr.push(parseValue(lines[i]!.indent));
        } else {
          arr.push(null);
        }
        continue;
      }

      // `- key: value` starts a map item
      if (rest.includes(":") && !rest.startsWith('"') && !rest.startsWith("'")) {
        const colonIdx = rest.indexOf(":");
        const key = rest.slice(0, colonIdx).trim();
        const inline = rest.slice(colonIdx + 1).trim();
        const item: Record<string, YamlValue> = {
          [key]: inline === "" ? null : parseScalar(inline),
        };
        // Nested keys under this list item
        while (i < lines.length && lines[i]!.indent > indent && !lines[i]!.content.startsWith("- ")) {
          const nested = parseMap(lines[i]!.indent);
          Object.assign(item, nested);
        }
        // If key had empty inline, fill nested block as value when only one pending null
        if (inline === "" && item[key] === null && i < lines.length && lines[i]!.indent > indent) {
          // already merged via parseMap above if present
        }
        // Handle `- key:` with nested map as value
        if (inline === "") {
          // parseMap in the while loop consumed nested keys into item — good for flat merge.
          // For `- at: "06:45"` style, inline is non-empty.
        }
        arr.push(item);
        continue;
      }

      arr.push(parseScalar(rest));
    }
    return arr;
  }

  if (lines.length === 0) return null;
  return parseValue(lines[0]!.indent);
}
