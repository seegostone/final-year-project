**Deployment Guide**

- **Purpose**: quick local containerized setup for development/integration using Docker Compose.

Prerequisites:
- Docker & Docker Compose installed

Quick start (build and run):

```bash
docker-compose build
docker-compose up
```

Notes:
- The `backend/.env` currently points to a MongoDB Atlas cluster. When running `docker-compose` the compose file overrides `MONGODB_URI` to use the included `mongo` service. If you want to use Atlas instead, remove or change the `MONGODB_URI` in the `docker-compose.yml` or provide a runtime env file.
- Backend service listens on port `5000` (mapped) and frontend on `5173` (serving via nginx on port 80 internally).
- `.dockerignore` files are added to avoid embedding `.env` and other local build artifacts into images.

Next steps (optional):
- Add a production `nginx` configuration for the frontend to handle SPA routing.
- Add healthchecks and small wait-for scripts in `docker-compose` to ensure dependent services are ready.
- Move sensitive secrets out of repo and use Docker secrets or a CI/CD secrets manager for production.
