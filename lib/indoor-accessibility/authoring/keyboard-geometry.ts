export interface KeyboardCoordinate {
  label: string;
  x: number;
  y: number;
}

export interface KeyboardGeometryValidation {
  coordinates: KeyboardCoordinate[];
  errors: string[];
}

export function parseCoordinateTable(input: string): KeyboardGeometryValidation {
  const errors: string[] = [];
  const coordinates = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line, index) => {
      const [label, xRaw, yRaw] = line.split(",").map((part) => part.trim());
      const x = Number(xRaw);
      const y = Number(yRaw);
      if (!label || !Number.isFinite(x) || !Number.isFinite(y)) {
        errors.push(`Line ${index + 1} must be label,x,y.`);
        return [];
      }
      if (x < 0 || x > 1 || y < 0 || y > 1) {
        errors.push(`Line ${index + 1} coordinates must be between 0 and 1.`);
        return [];
      }
      return [{ label, x, y }];
    });
  return { coordinates, errors };
}

export function validateKeyboardGeometry(input: string): KeyboardGeometryValidation {
  const result = parseCoordinateTable(input);
  if (result.coordinates.length === 0 && result.errors.length === 0) {
    return { coordinates: [], errors: ["At least one coordinate is required."] };
  }
  return result;
}
