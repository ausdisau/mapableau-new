package au.com.mapable.core.common

fun interface MapAbleClock {
    fun nowEpochMs(): Long
}

object SystemMapAbleClock : MapAbleClock {
    override fun nowEpochMs(): Long = System.currentTimeMillis()
}
