package au.com.mapable.feature.today

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNode
import androidx.compose.ui.test.onNodeWithText
import au.com.mapable.core.designsystem.MapAbleTheme
import org.junit.Rule
import org.junit.Test

class TodayScreenTest {
    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun todayScreenExposesParticipantControlsAndTextStatuses() {
        composeRule.setContent {
            MapAbleTheme {
                TodayScreen(lines = emptyList())
            }
        }

        composeRule.onNodeWithText("Today").assertIsDisplayed()
        composeRule.onNodeWithText("My Access").assertIsDisplayed()
        composeRule.onNodeWithText("Need help?").assertIsDisplayed()

        composeRule.onNode(hasContentDescription("Review sharing")).assertIsDisplayed()
        composeRule.onNode(hasContentDescription("Get human support")).assertIsDisplayed()

        composeRule.onNode(hasContentDescription("Status: Confirmed")).assertIsDisplayed()
        composeRule.onNode(hasText("Access fit recorded")).assertIsDisplayed()
        composeRule.onNode(hasText("Adjustments ready")).assertIsDisplayed()
    }
}
