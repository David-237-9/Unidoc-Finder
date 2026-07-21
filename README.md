# Unidoc Finder

A full-stack application for searching and managing university documents and theses.

## Project Structure

```
Unidoc-Finder/
├── backend/           # Spring Boot Kotlin backend
├── frontend/          # React TypeScript frontend
├── compose/           # Docker Compose configuration
├── crawler/           # Document crawler service
└── README.md
```

## Prerequisites

- **Java 25+** (for backend)
- **Node.js 18+** (for frontend)
- **Docker & Docker Compose** (for containerization)
- **Gradle** (build tool)

## Quick Start

### Automatic Access Token Generation

Every system build automatically generates a new random 256-bit token in the backend image.
The crawler is built in the same Docker Compose build and copies that exact token from the backend image, so both services use the same value.

Both applications read the generated value from `/run/secrets/UF_ACCESS_TOKEN`.

> **Security warning:** This project deliberately persists the generated token in both images.
> Anyone who can pull, save, or inspect either image can recover it. The images should be kept private.

### Build Everything

```bash
gradle build
```

This will:
1. Build the backend JAR
2. Build the frontend app
3. Build the backend, frontend, and crawler Docker images
4. Generate the local Docker Compose runner

The backend image is built without Docker layer caching so each `gradle build` generates a new token. Building only the crawler copies the token from the existing `unidoc-backend:latest` image so the two images remain compatible.

### Run with Docker Compose

After building, start all services:

```bash
docker-compose -f compose/build/docker-compose-runner-local.yml up -d
```

Services will be available at:
- **Backend API**: http://localhost:8080/api
- **Frontend**: http://localhost:5173
- **Database**: localhost:5432 (PostgreSQL)
- **Elasticsearch**: http://localhost:9200

### Change the Access Token

Run a new system build and recreate the backend and crawler containers:

```bash
gradle build

docker compose -f compose/build/docker-compose-runner-local.yml up -d --force-recreate unidoc-backend unidoc-crawler
```

Each system build generates a different token. Existing containers continue using their old images until they are recreated.

### Stop Containers

```bash
docker-compose -f compose/build/docker-compose-runner-local.yml down
```
