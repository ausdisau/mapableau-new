package au.com.mapable.feature.access

import au.com.mapable.core.common.ApiResult
import au.com.mapable.core.model.AccessPlaceSummary
import au.com.mapable.core.network.MapAbleApiClient

/**
 * MapAble Access — list-first; MapLibre renders map chrome separately.
 * Device location is optional; search works without it (Independence parity).
 */
class AccessRepository(private val api: MapAbleApiClient) {
    suspend fun search(query: String): ApiResult<List<AccessPlaceSummary>> =
        api.searchAccess(query)
}
