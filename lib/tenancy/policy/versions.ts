export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10));
  const pb = b.split(".").map((n) => parseInt(n, 10));
  const length = Math.max(pa.length, pb.length);
  for (let i = 0; i < length; i++) {
    const av = pa[i] ?? 0;
    const bv = pb[i] ?? 0;
    if (Number.isNaN(av) || Number.isNaN(bv)) {
      return a.localeCompare(b);
    }
    if (av !== bv) return av - bv;
  }
  return 0;
}
