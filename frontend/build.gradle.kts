plugins {
    id("com.github.node-gradle.node") version "7.0.2"
    base
}

tasks.register<com.github.gradle.node.npm.task.NpmTask>("appNpmBuild") {
    args.set(listOf("run", "build"))
}

val buildDockerImage by tasks.registering(Exec::class) {
    group = "docker"
    description = "Builds the Docker image for the frontend"

    dependsOn("appNpmBuild")

    workingDir(project.projectDir)
    commandLine("docker", "compose", "-f", "src/main/docker/docker-compose.yml", "build")
}

tasks.named("assemble") {
    dependsOn("appNpmBuild")
    finalizedBy(buildDockerImage)
}
