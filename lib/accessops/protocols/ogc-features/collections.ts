export interface OgcCollectionSummary {
  id: string;
  title: string;
  readOnly: true;
}

export function buildOgcCollection(
  id: string,
  title: string,
): OgcCollectionSummary {
  return { id, title, readOnly: true };
}
