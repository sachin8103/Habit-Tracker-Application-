# Engineering Reasoning — Habit Tracker

## 1. Problem Understanding

The assignment is to deliver a complete Habit Tracker application that can be run and evaluated reliably. The implemented product addresses a simple recurring-progress workflow:

1. A user creates a habit with a name, optional description, and frequency.
2. The user views the habit list and selects a habit.
3. The user records a check-in for the current day.
4. The user reviews the habit details and check-in history.
5. The user can update or delete the habit.

The main technical problem is coordinating a browser frontend, a REST API, and durable relational storage while preserving basic data integrity. The solution therefore needs a clear API contract, validation at the request boundary, a rule preventing duplicate check-ins for the same habit/date, isolated automated tests, and a reproducible local startup path.

The current implementation is a local/development-quality full-stack application. It is not an authenticated multi-user product and does not claim to provide production deployment controls that are absent from the repository.

## 2. Requirements Analysis

### Functional Requirements

The implemented functional surface is:

- Create a habit with a name, optional description, and `DAILY`, `WEEKLY`, or `MONTHLY` frequency.
- List all habits.
- Retrieve one habit by ID.
- Update a habit.
- Delete a habit and its associated check-ins.
- Create one check-in for a habit and date.
- Reject duplicate check-ins for the same habit and date.
- List check-in history newest first.
- Return a health response from `GET /api/health`.
- Provide a frontend dashboard for the same create, read, update, delete, details, history, and check-in workflow.

### Non-Functional Requirements

- **Maintainability:** backend responsibilities are separated into controllers, services, repositories, entities, DTOs, exceptions, and configuration. The frontend is split into focused components and an API module.
- **Reliability:** database uniqueness and service checks protect the one-check-in-per-date rule. Compose health checks gate service startup. The backend image packages the application before runtime.
- **Usability:** the frontend supplies create/edit forms, selected-habit details, check-in history, empty states, loading states, inline validation, and API error messages. CSS includes a narrower-screen layout.
- **Validation:** Jakarta Bean Validation is applied to request DTOs, and the frontend performs matching name and description checks before submitting.
- **Performance considerations:** list operations use repository queries and map results to response DTOs. Check-in history is queried in descending date order. The application uses a Hikari-backed Spring datasource through the standard Spring Boot/JPA stack. No specialized caching or analytics path is implemented.
- **Reproducibility:** Java and Node baselines are declared, Maven and npm lock/build files are committed, and Docker Compose defines the three-service local stack.
- **Testability:** backend tests use Spring Boot, MockMvc, and an isolated H2 profile instead of requiring a running MySQL instance.

## 3. Technology Selection

- **Java 17:** provides an LTS baseline and is the explicit Maven compilation target. It avoids coupling the application to the newer Java runtime present in some developer environments.
- **Spring Boot:** supplies application bootstrapping, REST support, validation integration, datasource configuration, and dependency management in one established backend framework.
- **Maven:** is the native Java build tool for the selected Spring stack. The Maven Wrapper makes the expected Maven version available without requiring a global Maven installation.
- **Spring Data JPA:** provides repository interfaces for the two aggregates without requiring repetitive CRUD SQL or repository boilerplate.
- **Hibernate:** is the JPA provider used by Spring Boot to map the entities and manage the development schema.
- **MySQL:** is the persistent runtime database used by Compose and the default local configuration.
- **React:** supports the stateful dashboard workflow, including form state, selected-habit details, asynchronous requests, and loading/error transitions.
- **Vite:** provides the small frontend development server and production build used by the repository.
- **Docker:** packages the backend and frontend runtimes and supplies the MySQL image.
- **Docker Compose:** coordinates the frontend, backend, and database services, environment variables, network service names, health checks, and the persistent database volume.

The stack is intentionally small. The frontend uses the browser `fetch` API rather than adding an HTTP client dependency, and no migration, authentication, or UI framework dependency was introduced because those capabilities are not part of the implemented assignment surface.

## 4. Version Compatibility Strategy

The versions below are the versions declared or resolved by the repository. Docker Engine and Docker Compose are required but are not version-pinned by the project.

| Component | Version | Compatibility Reason |
|---|---|---|
| Java | 17 target | Matches `java.version` in `pom.xml` and the Eclipse Temurin 17 backend image. |
| Maven | 3.9.9 | Declared by `.mvn/wrapper/maven-wrapper.properties`; used by `./mvnw`. |
| Spring Boot | 3.4.5 | Parent POM manages a compatible Spring Framework/Jakarta-based dependency set. |
| Spring Framework | Spring Boot 3.4.5 managed | Supplied transitively by the Spring Boot web starter. |
| Spring Data JPA | 3.4.5 | Resolved by the Spring Boot 3.4.5 dependency management. |
| Hibernate ORM | 6.6.13.Final | Resolved JPA provider for the selected Spring Boot line. |
| Jakarta Persistence API | 3.1.0 | Matches Hibernate 6/Spring Boot 3 and the `jakarta.persistence` imports in the entities. |
| MySQL Connector/J | Spring Boot-managed runtime dependency | Declared as `com.mysql:mysql-connector-j`; the exact version is inherited rather than pinned in `pom.xml`. |
| MySQL | 8.4 image | Declared by `compose.yaml` and used for runtime persistence. |
| Node.js | 20 | Declared by `.nvmrc`, `package.json` engines, and the frontend Docker image. |
| npm | 10.x | Declared by the frontend `package.json` engine range. |
| React | 18.3.1 | Exact frontend dependency version. |
| Vite | 6.4.3 | Exact frontend development/build dependency version. |
| Docker | Not pinned | The repository requires a working Docker Engine but does not declare an engine version. |
| Docker Compose | V2 plugin, not pinned | The repository uses the `docker compose` command and Compose health-condition syntax. |

The important compatibility boundary is the Spring Boot 3/Jakarta transition. The project uses `jakarta.persistence` and `jakarta.validation` packages consistently; it does not mix the older `javax.persistence` API with the Boot 3 stack. The backend image and Maven compiler target both use Java 17. The frontend dependency lockfile and engine constraints keep React/Vite tooling on the Node 20/npm 10 baseline, even though a developer machine with a newer Node/npm version may emit engine warnings.

## 5. System Architecture

```text
React + Vite frontend
          |
          | HTTP/JSON
          v
Spring Boot REST API
          |
          v
Controller layer
          |
          v
Service layer
          |
          v
Spring Data JPA repositories
          |
          v
Hibernate/JPA entity mappings
          |
          v
MySQL 8.4
```

- The **frontend** owns browser state, form interaction, display formatting, and user-facing loading/error/empty states.
- The **controllers** own HTTP routes, request binding, validation activation, and response status codes.
- The **services** own application behavior such as resource lookup, field normalization, check-in duplicate checks, and DTO mapping.
- The **repositories** own persistence operations through Spring Data interfaces.
- The **entities** express database relationships and constraints.
- The **database** stores habits and check-ins across application restarts when the Compose volume is retained.

## 6. Backend Design

### Controller Layer

`HabitController` and `HealthController` are deliberately thin. They declare the REST contract under `/api`, bind path variables and JSON request bodies, activate `@Valid`, delegate to services, and select the create/delete status codes. They do not contain persistence queries or check-in business rules.

This keeps HTTP concerns separate from behavior that could also be exercised through service or integration tests.

### Service Layer

`HabitService` is the application boundary for habit operations. It trims and normalizes stored text, loads missing habits through a single lookup path, maps entities to response DTOs, checks for an existing check-in, and translates a database uniqueness race into the same duplicate-check-in business error.

Keeping these rules in the service avoids duplicating them across controller methods and makes the controller contract easier to read.

### Repository Layer

`HabitRepository` uses the standard `JpaRepository<Habit, Long>` contract. `HabitCheckInRepository` adds only the queries required by the implemented behavior: checking whether a habit/date pair exists and retrieving check-ins ordered by date descending.

Spring Data is appropriate here because the required operations are conventional CRUD and derived queries. A custom data-access abstraction would add complexity without a demonstrated need.

### DTO Layer

The request records `CreateHabitRequest`, `UpdateHabitRequest`, and `CheckInRequest` define input contracts independently of the JPA entities. `HabitResponse` and `CheckInResponse` define output contracts and expose only the fields needed by the frontend.

This prevents the controller from accepting entity objects directly and avoids exposing JPA relationships as an accidental JSON contract.

### Exception Layer

`ApiExceptionHandler` is a `@RestControllerAdvice` that converts resource-not-found, duplicate-check-in, validation, malformed JSON, database-conflict, illegal-argument, and unexpected failures into `ApiError` responses. The controllers therefore do not need repeated try/catch or error serialization code.

## 7. Data Model

### Habit

- **Purpose:** stores the recurring activity the user wants to track.
- **Fields:** generated `Long id`, required `name` up to 100 characters, optional `description` up to 500 characters, required `HabitFrequency`, immutable `createdAt`, mutable `updatedAt`, and a collection of check-ins.
- **Relationship:** one `Habit` has many `HabitCheckIn` records through `mappedBy = "habit"`.
- **Constraints:** `name`, `frequency`, `createdAt`, and `updatedAt` are non-null at the database mapping level. Creation/update timestamps are assigned by lifecycle callbacks.

### HabitCheckIn

- **Purpose:** records that a habit was checked in on a calendar date.
- **Fields:** generated `Long id`, a required lazy `ManyToOne` habit reference, required `LocalDate checkInDate`, and immutable `Instant createdAt`.
- **Relationship:** each check-in belongs to one habit through the `habit_id` foreign key.
- **Constraints:** the table has a unique constraint on `(habit_id, check_in_date)`, so one habit cannot have two records for the same date. The parent habit uses cascade-all and orphan removal for its check-ins.

### HabitFrequency

`HabitFrequency` is an enum with exactly `DAILY`, `WEEKLY`, and `MONTHLY`. It is persisted as a string rather than an ordinal.

## 8. Database Design

MySQL 8.4 is the runtime database in Compose. Hibernate creates or updates the schema from the JPA mappings because `spring.jpa.hibernate.ddl-auto` is configured from `JPA_DDL_AUTO` and defaults to `update`.

There are no Flyway, Liquibase, or SQL migration files. This is a deliberate simplicity trade-off for the assignment-sized local application, not a claim that Hibernate `update` is a complete production migration strategy.

The primary keys are generated identity `Long` values. `habit_check_ins.habit_id` references the parent habit. The unique check-in constraint is enforced both in service logic and in the database, covering ordinary duplicate requests and concurrent insert races. The Compose `mysql-data` named volume preserves MySQL data until it is explicitly removed.

The test profile uses H2 in memory with `create-drop`, keeping tests isolated from developer or Compose data.

## 9. REST API Design

The API uses resource-oriented nouns and standard HTTP methods:

| Method | Endpoint | Purpose | Success |
|---|---|---|---|
| `GET` | `/api/health` | Return application health text | `200 OK`, `ok` |
| `GET` | `/api/habits` | List habits | `200 OK` |
| `GET` | `/api/habits/{id}` | Retrieve one habit | `200 OK` |
| `POST` | `/api/habits` | Create a habit | `201 Created` |
| `PUT` | `/api/habits/{id}` | Replace editable habit fields | `200 OK` |
| `DELETE` | `/api/habits/{id}` | Delete a habit and its check-ins | `204 No Content` |
| `GET` | `/api/habits/{id}/check-ins` | Retrieve check-in history | `200 OK` |
| `POST` | `/api/habits/{id}/check-ins` | Create a check-in | `201 Created` |

Habit requests contain `name`, `description`, and `frequency`. Check-in requests contain an ISO `checkInDate`. Responses contain explicit DTO fields, including timestamps and `checkInCount` for habits.

The API returns `400` for invalid or malformed requests, `404` when a referenced habit does not exist, `409` for duplicate or other database conflicts, `201` for creation, `204` for deletion, and `500` for an unexpected server failure.

## 10. Validation Strategy

Validation is applied at the API boundary with Jakarta annotations:

- `CreateHabitRequest.name` and `UpdateHabitRequest.name` use `@NotBlank` and `@Size(max = 100)`.
- `CreateHabitRequest.description` and `UpdateHabitRequest.description` use `@Size(max = 500)` when supplied.
- Both habit request records require `frequency` with `@NotNull`.
- `CheckInRequest.checkInDate` uses `@NotNull` and `@PastOrPresent`.

The controller uses `@Valid` so invalid requests are rejected before service operations run. This prevents invalid values from entering the service and database layers and gives clients a consistent error path. The frontend repeats the user-facing name/description checks for immediate feedback, while the backend remains authoritative.

## 11. Exception Handling

- **Missing habit:** `ResourceNotFoundException` is raised by the service lookup and mapped to `404 Not Found`.
- **Duplicate check-in:** `DuplicateCheckInException` is mapped to `409 Conflict`.
- **Validation failure:** `MethodArgumentNotValidException` is converted to an error map rendered inside the `message` field.
- **Malformed JSON or invalid enum/date representation:** `HttpMessageNotReadableException` is mapped to `400 Bad Request`.
- **Database conflict:** `DataIntegrityViolationException` is mapped to `409 Conflict`; the check-in service also translates its specific duplicate case to the domain exception.
- **Illegal argument:** `IllegalArgumentException` is mapped to `400 Bad Request`.
- **Unexpected failure:** the generic handler returns `500 Internal Server Error` with a non-sensitive generic message.

Centralizing this mapping keeps response shape and HTTP semantics consistent across endpoints.

## 12. Habit Check-In Logic

A check-in request contains a `LocalDate`, not a timestamp. The API rejects future dates but accepts today and past dates. When a check-in is requested, the service first verifies that the parent habit exists, checks the repository for the same habit/date pair, and saves a new `HabitCheckIn` with an `Instant` creation timestamp.

The database unique constraint remains the final integrity guard. If a concurrent operation violates it, the service converts the resulting integrity exception into the same conflict behavior used for the pre-check.

The history repository method orders records by `checkInDate` descending. The frontend adds a successful response to the selected history and refreshes the habit so its `checkInCount` is current.

No streak calculation, reminder scheduling, backdated edit operation, or check-in deletion endpoint is implemented.

## 13. Frontend Architecture

The frontend is a React application rooted at `frontend/src/main.jsx` and composed around `App.jsx`:

- `Navbar` displays total habit and check-in counts.
- `HabitList` renders the empty state or a collection of `HabitCard` components.
- `HabitCard` displays habit metadata and exposes edit, check-in, and delete actions.
- `HabitForm` handles create and edit input fields.
- `CheckInButton` owns the small check-in action state.
- `LoadingState` and `ErrorMessage` provide shared status presentation.
- `App` owns the current habits, selected habit, form mode, loading/submission state, details, history, and request error state.

State is managed with React `useState`, `useEffect`, and `useMemo`. The form is controlled by React state. Loading, empty, validation, details-error, and API-error states are explicitly rendered. CSS uses a two-column dashboard that collapses to one column below 900px.

## 14. Frontend–Backend Integration

`frontend/src/api/habits.js` contains the fetch wrapper and functions for every implemented API operation. The base URL is read from `import.meta.env.VITE_API_BASE_URL` and defaults to `http://localhost:8080/api`.

Requests send JSON for create, update, and check-in operations. Non-success responses are parsed for the backend `message` or `error` and surfaced as JavaScript errors for the UI. A `204` delete response is handled without attempting to parse JSON.

The backend CORS configuration allows these local development origins for `/api/**`:

- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `http://localhost:5174`
- `http://127.0.0.1:5174`

This is a specific development allowlist, not an unrestricted wildcard policy.

## 15. Docker and Reproducibility

Docker Compose is used because the application needs three cooperating processes: a MySQL database, a Java backend, and a Vite frontend.

- **MySQL container:** uses the `mysql:8.4` image, initializes the configured database/user, exposes port `3306`, and stores data in `mysql-data`.
- **Backend container:** uses the Eclipse Temurin 17 JDK image, installs the tools needed for the startup wait, packages the Spring Boot JAR during image build, waits for the Compose `mysql` service to resolve and accept TCP connections, and exposes port `8080`.
- **Frontend container:** uses Node 20 Alpine, installs the locked frontend dependencies, and runs Vite on port `5173`.
- **Networking:** the backend uses the Compose service name `mysql` in its JDBC URL. The browser-facing frontend uses `localhost:8080` because API requests originate from the host browser.
- **Startup dependencies:** MySQL must be healthy before the backend starts; the frontend depends on the backend health check at `/api/health`.
- **Configuration:** Compose passes database, JPA, server-port, and frontend API values through environment variables.

This gives an evaluator a single canonical stack and avoids requiring a host-installed MySQL server for the primary path. Docker Engine and Compose versions remain external prerequisites because this repository does not pin them.

## 16. Configuration and Secrets

`application.properties` uses environment placeholders with local defaults for `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JPA_DDL_AUTO`, and `SERVER_PORT`. Compose additionally uses `DB_NAME` and `DB_ROOT_PASSWORD` when initializing MySQL. The frontend uses `VITE_API_BASE_URL`.

`.env.example` and `frontend/.env.example` show development values without real credentials. `.gitignore` excludes `.env` files while retaining the example files. Credentials should be supplied through the environment and replaced for shared environments; the committed defaults are only for local evaluation.

The application has no authentication, authorization, account model, or secret manager integration.

## 17. Testing Strategy

### Implemented automated tests

- `HabitTrackerApplicationTests` verifies that the Spring application context loads under the test profile.
- `HabitControllerIntegrationTest` uses `@SpringBootTest`, `@AutoConfigureMockMvc`, and H2 to exercise the HTTP layer and persistence behavior. It covers create, list, read-by-ID, update, check-in, history, duplicate rejection, delete, and the final empty list.
- `application-test.properties` uses an H2 in-memory database with `create-drop`, so the test suite is isolated from MySQL.

### Build verification

- Backend command: `./mvnw clean test`.
- Frontend command: `cd frontend && npm ci && npm run build`.
- Docker image verification: the backend and frontend images were built successfully during the implementation work.
- Compose syntax verification: `docker compose config --quiet` completed successfully.

There is no frontend unit-test or automated browser-test script in `frontend/package.json`.

## 18. Verification Process

The following distinction is intentional.

### IMPLEMENTED

- Full CRUD and check-in endpoints exist.
- H2-backed MockMvc integration coverage exists for the core backend workflow.
- MySQL Compose configuration, persistence volume, health checks, and environment wiring exist.
- The frontend calls the implemented API and renders the corresponding workflow.
- The backend image builds a runnable packaged JAR rather than depending on Maven downloads during container startup.

### VERIFIED

- `./mvnw clean test` passed with 2 tests and no failures.
- `npm ci` and `npm run build` completed successfully. The host used for that run was Node 24/npm 11, so npm emitted the project’s expected engine warning; the repository requirement remains Node 20/npm 10.x.
- Maven dependency resolution confirmed Spring Boot 3.4.5, Spring Data JPA 3.4.5, Hibernate 6.6.13.Final, and Jakarta Persistence 3.1.0.
- `docker compose config --quiet` passed.
- The backend Docker image build passed after moving JAR packaging into the image build.
- The automated test verified create, read, update, check-in, duplicate rejection, delete, and empty-state API behavior using H2.

### Not conclusively verified in the final clean run

- A final fresh `docker compose up --build` run reaching healthy MySQL, backend, and frontend states was not conclusively completed in the recorded session. Earlier attempts exposed host-port conflicts, runtime Maven dependency downloads, and a temporary hostname override; the implementation was adjusted afterward, but the final health-and-persistence cycle should still be rerun before treating it as a release gate.
- Automated browser interaction and restart persistence against a live MySQL container are not covered by repository tests.

## 19. Important Engineering Decisions

### Decision: Use Java 17 with Spring Boot 3.4.5

**Reason:** Java 17 is an LTS baseline and is explicitly supported by the backend image and Maven compiler configuration. Spring Boot 3.4.5 supplies a coherent Jakarta-based dependency set.

**Alternative:** Use a newer Java release or independently version every Spring dependency.

**Why the alternative was not selected:** It would widen compatibility risk without a demonstrated requirement. Spring Boot dependency management already supplies the compatible framework, JPA, Hibernate, and validation versions.

### Decision: Use a layered backend

**Reason:** Separating HTTP mapping, business rules, persistence, data contracts, and error handling keeps the assignment-sized codebase readable and testable.

**Alternative:** Put repository calls and business rules directly in controllers.

**Why the alternative was not selected:** It would couple API transport concerns to persistence and make duplicate-check-in behavior harder to exercise and change.

### Decision: Use DTO records instead of exposing entities

**Reason:** Request validation and response shape are API concerns. DTOs prevent the JPA relationship graph from becoming the public JSON contract.

**Alternative:** Bind requests directly to `Habit` and serialize entities.

**Why the alternative was not selected:** It would expose persistence details and make validation/response evolution less controlled.

### Decision: Use both service checking and a database uniqueness constraint for duplicate check-ins

**Reason:** The service gives a clear conflict response for normal requests, while the database constraint protects integrity if two requests race.

**Alternative:** Rely only on an in-memory check or only on the database exception.

**Why the alternative was not selected:** An application-only check is not concurrency-safe; database-only handling would make the normal business error path less explicit.

### Decision: Use H2 for tests and MySQL for runtime

**Reason:** H2 keeps tests fast and isolated, while MySQL matches the intended persistent runtime and Compose environment.

**Alternative:** Require MySQL for every test run.

**Why the alternative was not selected:** It would make backend tests dependent on external service startup and local credentials without improving the controller contract coverage provided by MockMvc.

### Decision: Use Hibernate `update` rather than a migration tool

**Reason:** The current schema is small and the assignment requires a runnable local application with minimal setup.

**Alternative:** Add Flyway or Liquibase migrations.

**Why the alternative was not selected:** No migration tool is present in the implementation, and adding one would increase setup and maintenance surface. This remains a limitation for production schema governance.

### Decision: Use Compose health checks and a persistent named volume

**Reason:** The backend needs a reachable database before it can start, and evaluator restarts should retain data unless explicitly reset.

**Alternative:** Start all processes without readiness checks or use an ephemeral database.

**Why the alternative was not selected:** Process launch order is not the same as service readiness, and ephemeral storage would make persistence behavior impossible to evaluate.

### Decision: Package the backend JAR during image build

**Reason:** Running Maven and `spring-boot:run` at container startup required runtime dependency resolution and made startup sensitive to network/DNS availability. Packaging during the image build makes runtime launch use the already-built JAR.

**Alternative:** Continue downloading dependencies and launching through Maven when the container starts.

**Why the alternative was not selected:** The observed container startup failure demonstrated that runtime Maven resolution was not reliable enough for the one-command startup goal.

### Decision: Use an explicit local CORS allowlist

**Reason:** The browser frontend runs on known local Vite origins, and the backend only needs to permit those origins for `/api/**`.

**Alternative:** Allow every origin with a wildcard.

**Why the alternative was not selected:** A specific development allowlist avoids making the API broadly cross-origin accessible while still supporting the configured local ports.

## 20. Trade-offs

- **Layering vs. minimal code:** The project has more files than a controller-only prototype, but the boundaries make validation, testing, and future changes easier to localize.
- **Hibernate schema update vs. migrations:** `update` reduces evaluator setup, but it does not provide versioned, reviewable production migrations.
- **MySQL runtime vs. H2-only runtime:** MySQL validates the intended persistent database behavior, while H2 keeps automated tests independent and fast. The two databases can still differ in dialect behavior, so live-MySQL verification remains valuable.
- **Fetch API vs. HTTP client dependency:** `fetch` reduces frontend dependencies and is sufficient for the small API surface, but it leaves request concerns in a small custom wrapper.
- **Vite development server in Docker vs. production static serving:** the current image is easy to run and supports evaluator development, but it is not a production-optimized frontend deployment.
- **Compose convenience vs. local-process flexibility:** Compose makes the full stack reproducible, while local development still requires a separately configured MySQL instance when Docker is not used.
- **No authentication vs. simple data model:** the current implementation is straightforward to evaluate, but all habits belong to the shared application rather than an authenticated user.

## 21. Error Handling and Edge Cases

- **Missing habit:** service lookup returns `404` through `ResourceNotFoundException`.
- **Invalid habit:** blank names, oversized names/descriptions, and missing frequencies are rejected with `400` validation responses.
- **Duplicate check-in:** the service and database constraint return `409`.
- **Invalid ID:** a syntactically valid but nonexistent numeric ID follows the missing-resource path. Malformed path values are handled by Spring’s request binding/error path rather than a custom domain handler.
- **Future check-in date:** rejected by `@PastOrPresent` with `400`.
- **Empty data:** the API returns an empty array and the frontend displays an empty-state panel.
- **Backend unavailable:** the frontend request wrapper converts failed requests into user-visible error messages; it does not implement offline caching or retry queues.
- **Database unavailable:** the backend cannot complete persistence operations, and Compose delays backend startup until MySQL is reachable. No application-level database retry policy is implemented after startup.

## 22. Security Considerations

Implemented measures include:

- credentials are supplied through environment variables and ignored `.env` files rather than committed secrets;
- request DTOs validate input lengths, required fields, enum values, and check-in dates;
- JPA/database constraints protect required fields and duplicate check-ins;
- CORS is limited to the configured local frontend origins;
- unexpected errors return a generic message rather than exposing the exception text.

Authentication, authorization, rate limiting, CSRF strategy, transport encryption, and production secret management are not implemented. The current configuration is for local development/evaluation, not a claim of production security completeness.

## 23. Known Limitations

- No authentication, authorization, or per-user ownership.
- No streak calculation, reminders, analytics, or scheduled notifications.
- No check-in deletion or editing endpoint.
- No versioned database migrations.
- No automated frontend/browser tests.
- The Docker frontend runs Vite’s development server instead of a production static server.
- Docker Engine and Compose versions are not pinned.
- Final clean Compose health and restart-persistence verification remains a release validation task, as noted in Section 18.

## 24. Future Improvements

The following are **NOT CURRENTLY IMPLEMENTED**:

- Add authentication and per-user habit ownership.
- Add streak and progress analytics.
- Add reminders or scheduled notifications.
- Add check-in correction/deletion workflows.
- Add Flyway or Liquibase migrations.
- Add production frontend static serving and deployment configuration.
- Add browser tests and CI/CD checks.
- Add structured application metrics, centralized logs, and monitoring.

## 25. Final Engineering Assessment

The implementation is a coherent assignment-sized full-stack system with a React/Vite client, a layered Spring Boot REST API, JPA/Hibernate persistence, and a MySQL Compose runtime. The strongest design points are the explicit DTO/API boundary, centralized error handling, database-backed duplicate protection, isolated H2 integration tests, environment-based configuration, and Compose startup dependencies.

Compatibility is anchored by Java 17, Spring Boot 3.4.5, the Jakarta API family, React 18.3.1, Vite 6.4.3, and Node/npm engine constraints. The backend test suite and frontend build pass, and the container build/configuration path has been validated. The remaining verification gap is a final clean Compose health-and-persistence run and automated browser coverage, not an undocumented feature claim.

The architecture is maintainable for the current scope and reproducible for local evaluation. Before a production deployment, authentication, migration management, production frontend serving, secret management, observability, and broader end-to-end testing would need to be added deliberately.
