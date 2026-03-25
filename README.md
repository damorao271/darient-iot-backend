# Daniel Morao Nishimura - Technical Assessment

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Description

**Darient IoT Backend** – NestJS API with PostgreSQL, MQTT integration, WebSockets, and IoT telemetry processing.

## Project setup

```bash
# 1. Copy environment variables
cp .env.example .env
# Open .env and replace the placeholder values with your own

# 2. Install dependencies
npm install
```

## Running the project

### Full stack — backend + frontend + db + mqtt (hot reload)

From the parent `Darient/` directory:

```bash
cd ..   # go to Darient/

# First time or after Dockerfile / package.json changes:
./run.sh down
./run.sh --profile dev up --build

# Subsequent starts (images already built):
./run.sh --profile dev up
```

| Service               | URL                   |
| --------------------- | --------------------- |
| Backend (hot reload)  | http://localhost:3000 |
| Frontend (hot reload) | http://localhost:5173 |

Code changes in `src/` are reflected immediately.

---

### Backend only (standalone — includes db + mqtt)

**With Docker:**

```bash
cp .env.example .env   # first time only
docker compose up --build
```

**Locally (requires db and mqtt running separately):**

```bash
npm run start:dev
```

### Production mode

**With Docker (parent compose):**

From `Darient/`:

```bash
./run.sh --profile prod up --build
```

**Locally:**

```bash
npm run build
npm run start:prod
```

---

## API documentation (Swagger)

1. Start the application.
2. Open [http://localhost:3000/api](http://localhost:3000/api).
3. Click **Authorize** (padlock icon), enter your `API_KEY` from `.env`, then click **Authorize** → **Close**.

All endpoints require the API key sent as the `x-api-key` header.

---

## Run tests

### Unit tests

```bash
npm test
```

### E2E tests

```bash
npm run test:e2e
```

**Ensure Docker is running** (`docker compose up`) and `.env` is configured before running E2E tests — they use the real database.

### Other test commands

```bash
npm run test:watch   # unit tests in watch mode
npm run test:cov     # unit tests with coverage report
```

---

## Full Docker & run options

See [DOCKER.md](../DOCKER.md) in the parent folder for:

- Running backend, frontend, and IoT simulator separately or together
- Switching between development (hot reload) and production modes
- Environment variables reference and port summary
