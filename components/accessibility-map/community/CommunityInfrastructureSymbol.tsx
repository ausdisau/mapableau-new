import type { CommunityCategory } from "@/lib/access/community-infrastructure/types";

const categoryAssets: Record<CommunityCategory, string> = {
  parking: "/map-symbols/nps/parking-black-30.svg",
  toilet: "/map-symbols/nps/restrooms-black-30.svg",
  public_space: "/map-symbols/nps/point-of-interest-black-30.svg",
};

/** Decorative category cue. Adjacent text carries meaning; this is not an access badge. */
export function CommunityInfrastructureSymbol({
  category,
}: {
  category: CommunityCategory;
}) {
  return (
    <img
      src={categoryAssets[category]}
      width={30}
      height={30}
      alt=""
      aria-hidden="true"
      className="h-[30px] w-[30px] shrink-0"
    />
  );
}
