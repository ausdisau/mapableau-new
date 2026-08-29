package au.com.mapable.sync

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

/** Phase 17 — enqueue authoritative sync; no Redis access from device. */
class MapAbleSyncWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        // Repositories inject sync callbacks in production DI.
        return Result.success()
    }
}
