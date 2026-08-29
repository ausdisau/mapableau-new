package au.com.mapable.core.common

/**
 * Shared result wrapper for Android repositories.
 * Prefer this over inventing per-feature error types.
 */
sealed class ApiResult<out T> {
    data class Ok<T>(val value: T) : ApiResult<T>()
    data class Err(val message: String, val code: String? = null, val retryable: Boolean = false) :
        ApiResult<Nothing>()

    inline fun <R> map(transform: (T) -> R): ApiResult<R> = when (this) {
        is Ok -> Ok(transform(value))
        is Err -> this
    }

    fun getOrNull(): T? = (this as? Ok)?.value
}
