plugins {
    id("com.github.node-gradle.node") version "7.0.2"
    base
}

tasks.register<com.github.gradle.node.npm.task.NpmTask>("appNpmBuild") {
    args.set(listOf("run", "build"))
}

tasks.named("assemble") {
    dependsOn("appNpmBuild")
}