package au.com.mapable.feature.access

/**
 * MapLibre Android host — Access basemap remains OpenStreetMap/MapLibre.
 * Do not substitute Google Maps for Access rendering.
 *
 * Wire `org.maplibre.gl:android-sdk` when adding interactive map chrome;
 * list-first search ([AccessRepository]) remains the primary mobile UX.
 */
object MapLibreAccessPolicy {
    const val PROVIDER = "maplibre"
    const val BASEMAP = "openstreetmap"
    const val GOOGLE_MAPS_FOR_ACCESS = false
}
