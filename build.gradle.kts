plugins {
    base
}

allprojects {
    repositories {
        mavenCentral()
        maven(url = "https://plugins.gradle.org/m2/")
    }
}

tasks.named("build") {
    dependsOn(":compose:buildDockerImages")
}
