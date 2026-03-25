plugins {
    base
}

val isWindows = System.getProperty("os.name").lowercase().contains("windows")

val createDockerComposeRunnerLocal by tasks.registering(Exec::class) {
    group = "docker"
    description = "Merges docker-compose files into docker-compose-runner-local.yml"

    commandLine(
        "docker",
        "compose",
        "-f",
        "src/main/docker/docker-compose-template.yml",
        "-f",
        "src/main/docker/docker-compose-local.yml",
        "config"
    )


    val outFile = layout.buildDirectory.file("docker-compose-runner-local.yml").get().asFile

    // only standardOutput needs doFirst, since the dir may not exist yet
    doFirst {
        outFile.parentFile.mkdirs()
        standardOutput = outFile.outputStream()
    }
}

val packageDockerCompose by tasks.registering(Zip::class) {
    group = "build"
    description = "Packages docker-compose files into a zip archive"

    dependsOn(createDockerComposeRunnerLocal)

    archiveBaseName.set(project.name)
    archiveClassifier.set("docker-compose")
    archiveVersion.set(project.version.toString())
    destinationDirectory.set(layout.buildDirectory)

    into("") {
        from(layout.buildDirectory) {
            include(
                "docker-compose-template.yml",
                "docker-compose-local.yml",
                "docker-compose-prd.yml"
            )
        }
    }
}

tasks.assemble {
    dependsOn(packageDockerCompose)
}