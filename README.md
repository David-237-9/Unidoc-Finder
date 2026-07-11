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
For Linux/Mac:
```bash
curl -X POST http://localhost:8080/api/search/sync -H "Content-Type: application/json" -v
```
For Windows (PowerShell):
```powershell
Invoke-WebRequest -Uri http://localhost:8080/api/search/sync -Method POST -ContentType "application/json" -Verbose
```

### Executing the Crawler
To run the crawler service, use the following command:
```bash
npm install

npm run index OUTPUT_DESTINATION=1
```