export function FundingInfoBadge({ funding }: { funding: string }) {
  return (
    <span className="inline-flex rounded-full border border-mapable-blue/20 bg-mapable-blue/5 px-2.5 py-1 text-xs font-medium text-mapable-blue">
      {funding}
    </span>
  );
}
