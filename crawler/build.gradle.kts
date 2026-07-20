plugins {
    id("com.github.node-gradle.node") version "7.0.2"
    base
}

tasks.register<com.github.gradle.node.npm.task.NpmTask>("appNpmInstall") {
    args.set(listOf("install"))
}

val buildDockerImage by tasks.registering(Exec::class) {
    group = "docker"
    description = "Builds the Docker image for the crawler"

    dependsOn("appNpmInstall")

    workingDir(project.projectDir)
    commandLine("docker", "compose", "-f", "src/main/docker/docker-compose.yml", "build")
}

tasks.named("assemble") {
    finalizedBy(buildDockerImage)
}
