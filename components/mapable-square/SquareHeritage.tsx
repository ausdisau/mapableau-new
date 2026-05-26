import { SQUARE_HERITAGE } from "@/lib/mapable-square/copy";
import { mapableSectionCardClass } from "@/lib/brand/styles";

export function SquareHeritage() {
  return (
    <section className={mapableSectionCardClass} aria-labelledby="square-heritage-heading">
      <div className="space-y-4 p-6">
        <h2 id="square-heritage-heading" className="font-heading text-xl font-semibold">
          Standing on earlier meeting places
        </h2>
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="font-semibold text-primary">EnableNet &amp; portals</dt>
            <dd className="mt-1 text-muted-foreground">{SQUARE_HERITAGE.enableNet}</dd>
          </div>
          <div>
            <dt className="font-semibold text-primary">Disaboom &amp; scale</dt>
            <dd className="mt-1 text-muted-foreground">{SQUARE_HERITAGE.disaboom}</dd>
          </div>
          <div>
            <dt className="font-semibold text-primary">MapAble today</dt>
            <dd className="mt-1 text-muted-foreground">{SQUARE_HERITAGE.mapable}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
