"use client";

import { useCallback, useMemo } from "react";

import type { Provider } from "@/app/provider-finder/providers";
import { ReportAdButton } from "@/components/ads/ReportAdButton";
import { SponsoredLabel } from "@/components/ads/SponsoredLabel";
import { WhyAmISeeingThis } from "@/components/ads/WhyAmISeeingThis";
import { ProviderLayer, getProviderCoordinates } from "@/components/map/layers/ProviderLayer";
import { SponsoredServicesLayer } from "@/components/map/layers/SponsoredServicesLayer";
import { UserLocationLayer } from "@/components/map/layers/UserLocationLayer";
import {
  MapAccessibleResultsList,
  type MapAccessibleResultItem,
} from "@/components/map/MapAccessibleResultsList";
import { MapLegend } from "@/components/map/MapLegend";
import { MapLibreMap } from "@/components/map/MapLibreMap";
import { useMapLibre } from "@/components/map/MapProvider";
import { MapSidePanel } from "@/components/map/MapSidePanel";
import { SkipMapLink } from "@/components/map/SkipMapLink";
import { Badge } from "@/components/ui/badge";
import { pointsToBounds } from "@/lib/map/map-bounds";
import type { MapFeatureSelection } from "@/lib/map/map-feature-query";
import type { SponsoredAdResult } from "@/types/ads";

type ProviderFinderMapProps = {
  providers?: Provider[];
  userPosition?: { lat: number; lng: number } | null;
  centerOnProvider?: Provider | null;
  sponsoredAds?: SponsoredAdResult[];
  onSponsoredHidden?: (campaignId: string) => void;
  onProviderSelect?: (provider: Provider) => void;
  className?: string;
};

function MapSelectionPanel({
  providers,
  sponsoredAds,
  onProviderSelect,
  onSponsoredHidden,
}: {
  providers: Provider[];
  sponsoredAds: SponsoredAdResult[];
  onProviderSelect?: (provider: Provider) => void;
  onSponsoredHidden?: (campaignId: string) => void;
}) {
  const { selectedFeature, setSelectedFeature } = useMapLibre();

  if (!selectedFeature) return null;

  if (selectedFeature.kind === "provider") {
    const provider = providers.find((p) => p.id === selectedFeature.id);
    if (!provider) return null;
    return (
      <MapSidePanel
        title={provider.name}
        subtitle={`${provider.suburb} ${provider.state}`}
        liveMessage={`Selected provider ${provider.name}`}
        badges={
          provider.registered ? (
            <Badge variant="outline">Verified profile</Badge>
          ) : null
        }
        onClose={() => setSelectedFeature(null)}
      >
        <p className="text-sm text-muted-foreground">
          Rating {provider.rating.toFixed(1)} ({provider.reviewCount} reviews)
        </p>
        <button
          type="button"
          className="text-sm text-primary underline-offset-2 hover:underline"
          onClick={() => onProviderSelect?.(provider)}
        >
          View in results list
        </button>
      </MapSidePanel>
    );
  }

  if (selectedFeature.kind === "sponsored") {
    const ad = sponsoredAds.find((item) => item.campaignId === selectedFeature.id);
    if (!ad) return null;
    return (
      <MapSidePanel
        title={ad.headline}
        subtitle="Sponsored result"
        liveMessage={`Selected sponsored result ${ad.headline}`}
        badges={<SponsoredLabel />}
        onClose={() => setSelectedFeature(null)}
      >
        {ad.description ? (
          <p className="text-sm text-muted-foreground">{ad.description}</p>
        ) : null}
        <WhyAmISeeingThis reasons={ad.targetingSummary} />
        <ReportAdButton campaignId={ad.campaignId} onHidden={() => onSponsoredHidden?.(ad.campaignId)} />
      </MapSidePanel>
    );
  }

  return null;
}

export function ProviderFinderMap({
  providers = [],
  userPosition = null,
  centerOnProvider = null,
  sponsoredAds = [],
  onSponsoredHidden,
  onProviderSelect,
  className,
}: ProviderFinderMapProps) {
  const selectedId = centerOnProvider?.id ?? null;

  const bounds = useMemo(() => {
    const points = providers
      .map((provider) => {
        const coords = getProviderCoordinates(provider);
        return coords ? { lng: coords[0], lat: coords[1] } : null;
      })
      .filter(Boolean) as Array<{ lng: number; lat: number }>;

    if (userPosition) {
      points.push({ lng: userPosition.lng, lat: userPosition.lat });
    }

    return pointsToBounds(points);
  }, [providers, userPosition]);

  const flyCenter = useMemo<[number, number] | undefined>(() => {
    if (!centerOnProvider) return undefined;
    const coords = getProviderCoordinates(centerOnProvider);
    return coords ?? undefined;
  }, [centerOnProvider]);

  const accessibleItems = useMemo<MapAccessibleResultItem[]>(() => {
    const organic: MapAccessibleResultItem[] = providers.map((provider) => ({
      id: provider.id,
      title: provider.name,
      subtitle: `${provider.suburb} ${provider.state}`,
      kind: "provider",
      isVerified: provider.registered,
      statusText: provider.registered ? "Verified profile" : "Enquire for verification status",
    }));

    const sponsored: MapAccessibleResultItem[] = sponsoredAds.map((ad) => ({
      id: ad.campaignId,
      title: ad.headline,
      subtitle: ad.description ?? "Sponsored provider",
      kind: "sponsored",
      isSponsored: true,
      isVerified: ad.verificationPassed,
      statusText: ad.verificationPassed ? "Verified sponsor" : "Verification pending",
    }));

    return [...sponsored, ...organic];
  }, [providers, sponsoredAds]);

  const handleFeatureSelect = useCallback(
    (selection: MapFeatureSelection) => {
      if (selection.kind === "provider") {
        const provider = providers.find((p) => p.id === selection.id);
        if (provider) onProviderSelect?.(provider);
      }
      if (selection.kind === "sponsored") {
        void fetch("/api/ads/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignId: selection.id,
            eventType: "click",
            placementSurface: "map",
          }),
        });
      }
    },
    [onProviderSelect, providers],
  );

  const handleAccessibleSelect = useCallback(
    (id: string) => {
      const provider = providers.find((p) => p.id === id);
      if (provider) {
        onProviderSelect?.(provider);
        return;
      }
      const ad = sponsoredAds.find((item) => item.campaignId === id);
      if (ad) {
        void fetch("/api/ads/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignId: ad.campaignId,
            creativeId: ad.creativeId,
            eventType: "map_pin_opened",
            placementSurface: "map",
          }),
        });
      }
    },
    [onProviderSelect, providers, sponsoredAds],
  );

  return (
    <div className={className}>
      <SkipMapLink />
      <MapLibreMap
        bounds={flyCenter ? undefined : bounds}
        center={flyCenter}
        zoom={flyCenter ? 14 : undefined}
        onFeatureSelect={handleFeatureSelect}
      >
        <ProviderLayer providers={providers} selectedId={selectedId} />
        <SponsoredServicesLayer ads={sponsoredAds} />
        <UserLocationLayer position={userPosition} />
        <MapLegend className="absolute bottom-3 left-3 z-10 max-w-[220px]" />
        <MapSelectionPanel
          providers={providers}
          sponsoredAds={sponsoredAds}
          onProviderSelect={onProviderSelect}
          onSponsoredHidden={onSponsoredHidden}
        />
      </MapLibreMap>
      <MapAccessibleResultsList
        className="mt-4"
        items={accessibleItems}
        selectedId={selectedId}
        onSelect={handleAccessibleSelect}
      />
    </div>
  );
}

export default ProviderFinderMap;
