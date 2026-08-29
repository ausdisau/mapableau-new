package au.com.mapable.core.database

/**
 * Bounded offline drafts only (incidents / timesheet notes per mobile-communication contracts).
 * Authoritative state always re-fetched from API on reconnect.
 */
data class OfflineDraft(
    val id: String,
    val kind: String,
    val payloadJson: String,
    val createdAtEpochMs: Long,
)

class InMemoryOfflineDraftStore {
    private val drafts = linkedMapOf<String, OfflineDraft>()

    fun upsert(draft: OfflineDraft) {
        synchronized(drafts) { drafts[draft.id] = draft }
    }

    fun all(): List<OfflineDraft> = synchronized(drafts) { drafts.values.toList() }

    fun remove(id: String) {
        synchronized(drafts) { drafts.remove(id) }
    }
}
