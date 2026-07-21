# syntax=docker/dockerfile:1
FROM eclipse-temurin:25-jdk

RUN apt update && apt install -y curl openssl

WORKDIR /app

COPY build/libs/*.jar app.jar

RUN mkdir -p /run/secrets && \
    openssl rand -hex 32 > /run/secrets/UF_ACCESS_TOKEN && \
    chmod 0400 /run/secrets/UF_ACCESS_TOKEN

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
