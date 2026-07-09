plugins {
    kotlin("jvm") version "2.3.10"
    kotlin("plugin.spring") version "2.3.10"
    id("org.springframework.boot") version "4.0.3"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.unidoc-finder"
version = "0.0.1-SNAPSHOT"
description = "backend"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("jakarta.inject:jakarta.inject-api:2.0.1")
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("tools.jackson.module:jackson-module-kotlin")

    implementation("org.jdbi:jdbi3-core:3.37.1")
    implementation("org.jdbi:jdbi3-kotlin:3.37.1")
    implementation("org.jdbi:jdbi3-postgres:3.37.1")
    implementation("org.postgresql:postgresql:42.7.2")

    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testImplementation("org.mockito.kotlin:mockito-kotlin:5.1.0")
    testImplementation("org.mockito:mockito-core:5.2.0")
    testImplementation("org.mockito:mockito-junit-jupiter:5.2.0")

    testRuntimeOnly("org.junit.platform:junit-platform-launcher")

    implementation("org.springframework.boot:spring-boot-starter-data-elasticsearch")
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict", "-Xannotation-default-target=param-property")
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}

val buildDockerImage by tasks.registering(Exec::class) {
    group = "docker"
    description = "Builds the Docker image for the backend"

    dependsOn("bootJar")

    workingDir(project.projectDir)
    commandLine("docker", "compose", "-f", "src/main/docker/docker-compose.yml", "build")
}

tasks.named("assemble") {
    finalizedBy(buildDockerImage)
}

tasks.register<org.springframework.boot.gradle.tasks.run.BootRun>("benchmarkSearch") {
    group = "benchmark"
    description = "Runs a PostgreSQL vs Elasticsearch search benchmark"
    mainClass.set("com.unidocfinder.backend.BackendApplicationKt")
    classpath = sourceSets["main"].runtimeClasspath
    systemProperty("spring.profiles.active", "benchmark")
    systemProperty("spring.main.web-application-type", "none")
}
