export class BoundedEnumerator {
  constructor(public maxCandidates = 50) {}

  // Given candidate lists per variable, produce bounded combinations (cartesian product up to limit)
  enumerate(variableCandidates: Record<string, any[]>): any[] {
    const vars = Object.keys(variableCandidates);
    if (vars.length === 0) return [];

    const results: any[] = [];

    const recurse = (idx: number, acc: Record<string, any>) => {
      if (results.length >= this.maxCandidates) return;
      if (idx === vars.length) {
        results.push({ ...acc });
        return;
      }
      const v = vars[idx];
      const list = variableCandidates[v] || [];
      for (const item of list) {
        acc[v] = item;
        recurse(idx + 1, acc);
        if (results.length >= this.maxCandidates) return;
      }
    };

    recurse(0, {} as Record<string, any>);
    return results;
  }
}

export default BoundedEnumerator;