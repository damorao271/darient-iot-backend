<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

**Darient IoT Backend** – Prueba Técnica Backend.

Built with [Nest](https://github.com/nestjs/nest) framework TypeScript.

## Project setup

```bash
npm install
```

## Running the project

### Development mode (hot reload)

**With Docker:**

```bash
cp .env.example .env   # first time only
docker compose up --build
```

Starts backend + PostgreSQL. API at http://localhost:3000 — changes reflect immediately.

**Locally:**

```bash
npm run start:dev
```

### Production mode

**With Docker:** From parent `Darient/` folder: `docker compose up backend`

**Locally:**

```bash
npm run build
npm run start:prod
```

## API documentation (Swagger)

Swagger UI provides interactive API documentation to explore and test endpoints.

### Access Swagger

1. Start the application (Docker or `npm run start:dev`).
2. Open your browser at [http://localhost:3000/api](http://localhost:3000/api).
3. In the authorize section, enter the API key that is in the `.env` file. as `API_KEY`.

### Testing endpoints

All endpoints require an API key. Before making requests:

1. Click **Authorize** (padlock icon) in the top-right of the Swagger page.
2. Enter your API key value (from `API_KEY` in `.env`).
3. Click **Authorize**, then **Close**.

Your key will be sent as the `x-api-key` header with each request. You can now use **Try it out** on any endpoint to test it.

## Full Docker & run options

See [DOCKER.md](../DOCKER.md) in the parent folder for:

- Running backend and frontend separately or together
- Switching between development and production
- Environment variables and Docker Compose usage

## Run tests

### Unit tests

```bash
npm test
```

Runs Jest unit tests (`*.spec.ts` files in `src/`).

### E2E tests

```bash
npm run test:e2e
```

Runs end-to-end tests (`*.e2e-spec.ts` files in `test/`). **Ensure Docker is running** (`docker compose up`) and `.env` is configured, since E2E tests use the real database.

### Other test commands

```bash
npm run test:watch   # unit tests in watch mode
npm run test:cov     # unit tests with coverage report
```
