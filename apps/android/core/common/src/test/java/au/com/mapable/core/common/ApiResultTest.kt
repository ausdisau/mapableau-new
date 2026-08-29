package au.com.mapable.core.common

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ApiResultTest {
    @Test
    fun mapTransformsOk() {
        val result = ApiResult.Ok(2).map { it * 3 }
        assertEquals(6, (result as ApiResult.Ok).value)
    }

    @Test
    fun errGetOrNull() {
        assertNull(ApiResult.Err("x").getOrNull())
    }
}
