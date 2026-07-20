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

### Build Everything

```bash
 gradle build
```

This will:
1. Build the backend JAR
2. Build the frontend app
3. Create Docker images for both services

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
-
### Run Containers

```bash
docker-compose -f compose/build/docker-compose-runner-local.yml up -d
```

### Stop Containers

```bash
docker-compose -f compose/build/docker-compose-runner-local.yml down
```

### Sync Elasticsearch
The crawler requests the syncing automatically after each crawl, but you can also manually trigger a sync by sending a POST request to the backend API:

For Linux/Mac:
```bash
curl -X POST http://localhost:8080/api/search/sync -H "Content-Type: application/json" -v
```
For Windows (PowerShell):
```powershell
Invoke-WebRequest -Uri http://localhost:8080/api/search/sync -Method POST -ContentType "application/json" -Verbose
```

### Executing the Crawler
The crawler is already set up to run automatically when the backend starts.
However, if you want to run it manually, you can do so by executing the following commands in the `crawler` directory:
```bash
npm install

npm run index
```
