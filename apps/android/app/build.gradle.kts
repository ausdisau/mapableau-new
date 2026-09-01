plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "au.com.mapable.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "au.com.mapable.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0-backbone"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        buildConfigField("String", "API_BASE_URL", "\"https://mapable.com.au\"")
        buildConfigField("boolean", "MOBILE_API_DEFAULT_ENABLED", "false")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation(project(":core:common"))
    implementation(project(":core:model"))
    implementation(project(":core:designsystem"))
    implementation(project(":core:ui"))
    implementation(project(":core:network"))
    implementation(project(":core:auth"))
    implementation(project(":core:security"))
    implementation(project(":core:datastore"))
    implementation(project(":core:database"))
    implementation(project(":core:realtime"))
    implementation(project(":core:notifications"))
    implementation(project(":core:accessibility"))
    implementation(project(":core:googleplay"))

    implementation(project(":feature:auth"))
    implementation(project(":feature:today"))
    implementation(project(":feature:access"))
    implementation(project(":feature:care"))
    implementation(project(":feature:travel"))
    implementation(project(":feature:jobs"))
    implementation(project(":feature:inbox"))
    implementation(project(":feature:consent"))
    implementation(project(":feature:profile"))
    implementation(project(":feature:support"))
    implementation(project(":feature:settings"))

    implementation(project(":sync"))

    implementation(platform("androidx.compose:compose-bom:2024.10.01"))
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.navigation:navigation-compose:2.8.4")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
    implementation("androidx.work:work-runtime-ktx:2.10.0")

    debugImplementation("androidx.compose.ui:ui-tooling")
    testImplementation("junit:junit:4.13.2")
    testImplementation(project(":core:testing"))
}
