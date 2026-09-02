rootProject.name = "mapable-android"

pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

include(":app")

include(":core:common")
include(":core:model")
include(":core:designsystem")
include(":core:ui")
include(":core:network")
include(":core:auth")
include(":core:security")
include(":core:datastore")
include(":core:database")
include(":core:realtime")
include(":core:notifications")
include(":core:accessibility")
include(":core:googleplay")
include(":core:testing")

include(":feature:auth")
include(":feature:today")
include(":feature:access")
include(":feature:care")
include(":feature:travel")
include(":feature:jobs")
include(":feature:inbox")
include(":feature:consent")
include(":feature:profile")
include(":feature:support")
include(":feature:settings")

include(":sync")
include(":benchmark")
include(":baselineprofile")
