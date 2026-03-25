# Professional Report: AI Usage in the Technical Fullstack Assessment

## Darient IoT Backend – Coworking Reservation System

**Document Purpose:** This report documents how AI was used during development of this technical assessment project, demonstrating professional use as a productivity tool while clarifying that design decisions, architecture, and business logic were led by human judgment.

## Models Used

This project was developed using Cursor AI, the Model selection followed a task-based approach: faster models for routine work, stronger models for complex logic, timezones, and architecture.

### Composer 2 Fast / Auto (Efficiency)

Used for ~70% of work, focusing on speed and cost.

| Task                           | Deliverables                                                  |
| ------------------------------ | ------------------------------------------------------------- |
| NestJS module structure        | places.module, spaces.module, reservations.module             |
| CRUD endpoints and controllers | places.controller, spaces.controller, reservations.controller |
| DTOs and basic validation      | create-place.dto, update-space.dto, spaces-query.dto          |
| Swagger setup                  | @nestjs/swagger, API decorators, schemas                      |
| Boilerplate                    | Dockerfile, docker-compose.yml, README                        |
| Basic unit tests               | Jest setup, simple `*.spec.ts` files                          |

### GPT-5.3 Codex

Used for code-heavy, repetitive tasks.

| Task                    | Deliverables                                   |
| ----------------------- | ---------------------------------------------- |
| Prisma schema structure | place.prisma, space.prisma, reservation.prisma |
| Service methods         | CRUD logic in places.service, spaces.service   |
| Validation patterns     | Zod schemas in DTOs, CUID validation           |
| Seed scripts            | places.seed, spaces.seed, reservations.seed    |

### Sonnet 4.6

Used for business logic, queries, and moderate reasoning.

| Task                     | Deliverables                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| Pagination and filtering | reservations-query.dto (page, pageSize, sortBy, sortOrder, spaceId, clientEmail, fromDate, toDate) |
| Conflict detection flow  | reservations.service conflict logic                                                                |
| Week limit per client    | week.utils.ts, 3 reservations per week                                                             |
| E2E tests                | reservations.e2e-spec, places.e2e-spec, spaces.e2e-spec                                            |
| Error handling           | HttpExceptionFilter, PrismaExceptionFilter                                                         |

### Opus 4.6 / Premium (Intelligence)

Used for critical timezone handling, and architecture.

| Task                       | Deliverables                                                                           |
| -------------------------- | -------------------------------------------------------------------------------------- |
| Timezone strategy          | UTC storage, Place.timezone, timezone.utils.ts                                         |
| UTC migration              | 20260322120000_reservation_utc_timezone/migration.sql                                  |
| Interval overlap semantics | interval.utils.ts – back-to-back slots ([9:00–10:00] and [10:00–11:00]) do not overlap |
| API design                 | ResponseTransformInterceptor, @SuccessMessage, ParseCuidPipe                           |
| Validation design          | Custom parseTimeToMinutes, HH:mm checks, endTime > startTime                           |
| Denormalization choice     | Optional placeId on Reservation for query performance                                  |

### Workflow Summary

| Phase                   | Models Used                                         |
| ----------------------- | --------------------------------------------------- |
| Phase 1: Scaffolding    | Auto / Composer 2 Fast (modules, controllers, DTOs) |
| Phase 2: Implementation | Codex / Composer 2 Fast (services, seeds, CRUD)     |
| Phase 3: Business Rules | Sonnet (conflicts, limits, pagination)              |
| Phase 4: Critical Logic | Opus (timezone, intervals, migrations)              |
| Phase 5: Testing & QA   | Sonnet + Fast (E2E flows, edge cases)               |

### Cursor modes (Agent, Plan, Ask)

The workflow switched between **Agent**, **Plan**, and **Ask** depending on what each task needed:

| Mode      | When it was used                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Agent** | Implementing features, applying multi-file edits, running terminal commands, and iterating on code with tool use.                    |
| **Plan**  | Breaking down larger changes (architecture, migrations, cross-module refactors) before execution, to align steps with requirements.  |
| **Ask**   | Read-only exploration: explaining existing code, comparing options, or quick documentation-style answers without modifying the repo. |

This mix kept implementation efficient while reserving planning for higher-risk or broader changes and Ask for understanding without side effects.

## 1. Executive Summary

This project implements the Darient Technical Assessment requirements: a Node.js backend for a coworking reservation system. AI was used as a productivity aid for drafting, documentation, and implementation speed, never for core design or critical decisions.

Evidence of human-led design and execution is apparent across:

- Architecture and technology choices
- Business rules (timezone handling, interval semantics)
- Data model and migrations
- Test strategy and coverage
- Error handling and API design

## 2. Assessment Requirements Coverage

The project meets the stated requirements:

| Requirement                        | Implementation                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------ |
| Models (Place, Space, Reservation) | Prisma models with Place.timezone (extra requirement)                                |
| Business Rules                     | Conflict detection, max 3 reservations/week per client                               |
| CRUD Endpoints                     | Places, Spaces, Reservations with full CRUD                                          |
| Pagination                         | page, pageSize, sortBy, sortOrder in Reservations list                               |
| Documentation                      | README, Swagger                                                                      |
| Docker                             | docker-compose.yml with PostgreSQL, Mosquitto and health checks                      |
| Database + ORM                     | PostgreSQL + Prisma                                                                  |
| Architecture                       | NestJS modular structure                                                             |
| Authentication                     | API key in headers (x-api-key), ApiKeyGuard                                          |
| Tests                              | Unit tests (e.g. interval.utils, week.utils, time.utils) and E2E tests               |
| **IoT Bonus – MQTT subscriber**    | `IotModule` subscribes to `sites/+/offices/+/telemetry` and `reported`               |
| **IoT Bonus – Digital Twin**       | `DeviceDesired` / `DeviceReported` tables; PATCH publishes retained MQTT desired msg |
| **IoT Bonus – Telemetry store**    | `TelemetryAggregation` persists every reading; last-hour stats endpoint              |
| **IoT Bonus – Alert rules**        | In-memory window engine for CO2, OCCUPANCY_MAX, OCCUPANCY_UNEXPECTED                 |
| **IoT Bonus – WebSocket**          | Socket.io gateway emits `telemetry`, `alert:opened`, `alert:resolved`, `reported`    |
| **IoT Bonus – Admin REST**         | `GET/PATCH /spaces/:id/telemetry`, `/alerts`, `/device`, `/device/desired`           |

## 3. How AI Was Used (Productivity Role)

### 3.1. Documentation and Syntax

AI was used for:

- Documentation lookup: NestJS decorators, Prisma API, Zod schemas, date-fns-tz
- Boilerplate reduction: Controller structure, Swagger decorators, module wiring
- Formatting and style: Consistent formatting, naming, and import organization

Evidence of human control: Custom schemas (CreateReservationSchema), DTOs, and validation rules are tailored to the domain and differ from generic examples.

### 3.2. Implementation Scaffolding

AI could have been used to:

- Suggest NestJS module layout (controllers, services, DTOs)
- Propose Prisma schema structure
- Draft validation patterns

Evidence of human control: The architecture goes beyond templates. Examples:

- **Place.timezone:** Not in the spec; required for multi-timezone support
- **UTC storage:** Reservations store startAt/endAt in UTC with a migration (20260322120000_reservation_utc_timezone)
- **Serialization:** reservationDate and timezone returned in local time for the place

These choices reflect domain reasoning (multi-location, different timezones), not generic boilerplate.

### 3.3. Testing Assistance

AI might have helped with:

- Test structure and Jest syntax
- Typical cases for CRUD endpoints

Evidence of human control: Test design clearly reflects domain knowledge:

- **Interval overlap:** Explicit coverage that back-to-back slots (e.g. 09:00–10:00 and 10:00–11:00) do not overlap
- **Week limits:** Tests with fixed week dates (e.g. 2025-03-24) for deterministic behavior
- **Conflict detection:** Update flow that triggers schedule conflicts
- **Pagination and filters:** page, pageSize, spaceId, clientEmail, fromDate, toDate, sortBy, sortOrder

The scenarios and edge cases reflect deliberate thinking about business rules.

## 4. Where Human Expertise Was Clearly Applied

### 4.1. Architecture and Technology Choices

**Decision:** NestJS + Prisma + Zod.

**Rationale:** NestJS provides modular architecture, Prisma gives type-safe DB access, Zod enables strong runtime validation. These choices are coherent and intentional.

Evidence of human judgment: App wiring, filters (e.g. PrismaExceptionFilter, HttpExceptionFilter), custom ParseCuidPipe, interceptors (ResponseTransformInterceptor), and @SuccessMessage decorator show deliberate API and error-handling design.

### 4.2. Timezone and Date/Time Strategy

**Decision:** Store reservations in UTC, expose local date/time per place, base week limits on place timezone.

Evidence of human judgment: timezone.utils.ts uses date-fns-tz, with:

- getWeekBoundsUtc() for Monday–Sunday in place timezone, then converted to UTC
- localToUtc() / utcToLocalDateString() / utcToLocalTimeString() for conversion and display

This is non-trivial and matches real-world reservation behavior across locations.

**Migration design:** The migration shows awareness of schema changes (drop old columns, add startAt/endAt, data clearing when migration is not possible)—a clear technical decision, not AI output.

### 4.3. Interval Overlap Semantics

**Decision:** Overlapping intervals exclude back-to-back reservations (e.g. one ends exactly when another starts).

Evidence of human judgment: interval.utils.ts:

```ts
return startA < endB && endA > startB;
```

And interval.utils.spec.ts explicitly tests that [9:00-10:00] and [10:00-11:00] do not overlap.

The assessment did not specify this. The implementation shows intentional interpretation of "conflict" and "overlap."

### 4.4. Error Handling and API Contract

**Decision:** Structured responses, error codes, and consistent format.

Evidence of human judgment: Error codes such as ERR_SCHEDULE_CONFLICT, ERR_RESERVATION_LIMIT, ERR_SPACE_NOT_FOUND, ERR_INVALID_TIME_RANGE, ERR_INVALID_ID are defined and used consistently. The HttpExceptionFilter maps Zod validation issues to details and normalizes error format. This is a deliberate API design choice.

### 4.5. Denormalization (placeId in Reservation)

**Decision:** Optional placeId on Reservation, even though it can be derived from Space.

Evidence of human judgment: The spec asked to consider benefits and concerns. The model includes placeId as optional, supporting queries and filters without joins and making the tradeoff explicit in the schema.

### 4.6. Validation Strategy

**Decision:** Zod for DTOs and validation.

Evidence of human judgment: Schemas are specific to the domain:

- HH:mm format with hour/minute checks
- CUID validation for IDs
- Custom parseTimeToMinutes() and endTime > startTime refinement
- Query DTOs with fromDate/toDate validation (e.g. fromDate <= toDate)

These are tailored validation rules, not generic patterns.

### 4.7. Testing Strategy

Evidence of human judgment:

- **Unit tests:** Pure logic (intervals, weeks, time parsing) isolated in utility tests
- **E2E tests:** Full flows including setup, assertions, and cleanup, with correct test data lifecycle
- **Edge cases:** Back-to-back slots, week limits, schedule conflicts on create and update, invalid IDs, auth failures, validation errors

The mix of unit vs E2E and the selection of scenarios reflect testing experience.

## 5. AI Usage Boundaries

| Use Case       | AI Role                       | Human Role                                              |
| -------------- | ----------------------------- | ------------------------------------------------------- |
| NestJS setup   | Possible scaffolding          | Module structure, filters, guards, pipes                |
| Prisma schema  | Possible structure draft      | Place.timezone, UTC migration, placeId denormalization  |
| Business rules | Possible code draft           | Conflict semantics, week calculation in timezone        |
| Tests          | Possible test skeletons       | Edge cases, isolation, data setup/teardown              |
| Error format   | Possible examples             | Error codes, message wording, client-friendly responses |
| Documentation  | Possible README/Swagger draft | Final wording, deployment steps, Postman usage          |

AI was used as an accelerator for implementation and documentation; humans set direction, constraints, and quality bar.

## 6. Conclusion

AI was used as a productivity tool for:

- Reducing boilerplate and documentation lookup
- Suggesting patterns and syntax
- Possibly accelerating test and validation implementation

Human expertise drove:

1. **Architecture:** NestJS modules, Prisma, Zod, guards, filters, interceptors
2. **Domain design:** Timezone handling, UTC storage, serialization strategy
3. **Business rules:** Interval overlap, week limits per place timezone, conflict semantics
4. **Data model:** Place.timezone, optional placeId, migration design
5. **API and errors:** Response format, error codes, validation behavior
6. **Testing:** Coverage plan, scenarios, and edge cases

The project shows clear ownership of design and implementation, with AI supporting speed and consistency, not decision-making or deep domain understanding.
