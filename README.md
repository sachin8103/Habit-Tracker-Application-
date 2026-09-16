# Habit Tracker

## 1. Project Overview

Habit Tracker is a full-stack application for defining recurring habits and recording daily progress. Users can create, review, edit, and delete habits, choose a daily, weekly, or monthly frequency, record a check-in for the current day, and inspect check-in history.

The application provides a React dashboard, a Spring Boot REST API, and MySQL persistence. It is intended for local development and evaluation through Docker Compose or separate backend/frontend processes.

## 2. Features

- Create habits with a name, optional description, and frequency.
- View all habits or one habit by ID.
- Update habit details.
- Delete a habit and its associated check-ins.
- Record one check-in per habit and date.
- View check-in history in reverse date order.
- Show habit creation/update timestamps and check-in counts.
- Validate habit names, descriptions, frequencies, and check-in dates.
- Return structured API errors for validation, missing resources, conflicts, malformed requests, and server errors.
- Provide loading, empty, form-validation, and API-error states in the frontend.
- Use a responsive dashboard layout for desktop and narrower screens.
- Expose an application health endpoint for container health checks.

## 3. Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| Java | 17 | Backend runtime and compilation target |
| Maven | 3.9.9 | Backend build, via Maven Wrapper |
| Spring Boot | 3.4.5 | REST application and dependency management |
| Spring Data JPA | 3.4.5, Spring Boot-managed | Repository abstraction and persistence access |
| Hibernate ORM | 6.6.13.Final, Spring Boot-managed | JPA implementation and schema update support |
| MySQL | 8.4 Docker image | Runtime relational database |
| Node.js | 20 (`.nvmrc`; package engine `>=20 <21`) | Frontend runtime and tooling |
| npm | 10.x (`>=10 <11`) | Frontend dependency management |
| React | 18.3.1 | Frontend UI |
| Vite | 6.4.3 | Frontend development server and build tool |
| Docker | Required; engine version is not pinned in this repository | Container runtime |
| Docker Compose | Compose V2 plugin; version is not pinned in this repository | Multi-container orchestration |

Spring Boot manages the compatible Spring Framework, Jakarta Validation, MySQL Connector/J, and test dependency versions. The Maven Wrapper downloads Maven 3.9.9 when needed.

## 4. Architecture

```text
React/Vite frontend
        |
        v
Spring Boot REST API
        |
        v
Controllers -> Services -> Spring Data repositories -> Hibernate/JPA -> MySQL
```

- **Frontend:** `frontend/src` contains the dashboard, forms, habit cards, check-in controls, loading/error states, and the fetch-based API client.
- **Controller layer:** `src/main/java/com/habittracker/controller` maps HTTP requests to application operations.
- **Service layer:** `HabitService` applies business rules, including duplicate check-in prevention and resource lookup.
- **Repository layer:** Spring Data repositories load and persist habits and check-ins.
- **Entity/model layer:** `Habit` and `HabitCheckIn` map to the `habits` and `habit_check_ins` tables. A database uniqueness constraint prevents two check-ins for the same habit and date.
- **DTO layer:** Request and response records define the API contract and validation rules.
- **Exception layer:** `ApiExceptionHandler` converts application and validation failures into a consistent `ApiError` response.
- **Configuration:** `WebConfig` limits API CORS to the local frontend origins used by Vite.

## 5. Project Structure

```text
.
├── compose.yaml
├── backend.Dockerfile
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── api/habits.js
│       ├── components/
│       └── styles.css
├── src/
│   ├── main/java/com/habittracker/
│   │   ├── config/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── exception/
│   │   ├── repository/
│   │   └── service/
│   ├── main/resources/application.properties
│   └── test/
│       ├── java/com/habittracker/
│       └── resources/application-test.properties
├── pom.xml
├── mvnw
├── mvnw.cmd
├── .env.example
├── frontend/.env.example
├── start.sh
└── start.bat
```

`compose.yaml` is the canonical Docker startup definition. `backend.Dockerfile` packages the Spring Boot JAR during image build, and `frontend/Dockerfile` runs the Vite development server on port `5173`.

## 6. Prerequisites

### Docker setup

- Docker Engine must be installed and running.
- Docker Compose V2 must be available as `docker compose`.
- Host ports `3306`, `8080`, and `5173` must be available.

The repository does not pin Docker Engine or Docker Compose versions. Check the installed versions with:

```bash
docker --version
docker compose version
```

### Local development without Docker

- Java 17.
- Maven 3.9.9, or use the included `./mvnw` wrapper.
- Node.js 20 and npm 10.x.
- MySQL 8.4, or a compatible MySQL instance configured with the environment variables below.

## 7. Quick Start - Docker

Docker Compose is the primary setup. From a shell:

```bash
git clone <repository-url>
cd <repository>
docker compose up --build
```

Open the frontend at [http://localhost:5173](http://localhost:5173). The backend API is available at [http://localhost:8080/api](http://localhost:8080/api), and the health endpoint is [http://localhost:8080/api/health](http://localhost:8080/api/health).

The Compose stack starts:

- MySQL 8.4 on host port `3306`.
- The Spring Boot backend on host port `8080`.
- The Vite frontend on host port `5173`.

The backend waits for the MySQL service to be reachable, and the frontend waits for the backend health check. The MySQL data is stored in the named `mysql-data` volume.

Stop the application while retaining database data:

```bash
docker compose down
```

Stop the application and remove the persisted MySQL volume:

```bash
docker compose down --volumes
```

The convenience scripts `./start.sh` and `start.bat` perform a clean Compose start and remove existing Compose volumes before starting. Use them only when resetting local database data is acceptable.

## 8. Local Development Without Docker

### Database

Run a MySQL 8.4 instance and create a database/user matching the defaults, or provide equivalent values through exported environment variables. The default local JDBC URL is:

```text
jdbc:mysql://localhost:3306/habit_tracker?createDatabaseIfNotExist=true&serverTimezone=UTC
```

The application creates/updates its tables through Hibernate when it starts. See [Database Setup](#10-database-setup).

### Backend

From the repository root, export the backend variables if your MySQL settings differ from the defaults, then run:

```bash
./mvnw spring-boot:run
```

The backend listens on `http://localhost:8080` by default.

### Frontend

In a second terminal:

```bash
cd frontend
npm ci
npm run dev -- --host 0.0.0.0
```

Open `http://localhost:5173`. The frontend defaults to `http://localhost:8080/api` for its API base URL.

## 9. Environment Variables

Compose reads a root `.env` file for variable substitution. `.env.example` contains the backend/database defaults. The frontend can also read `frontend/.env`; Vite exposes only variables prefixed with `VITE_` to browser code.

| Variable | Required | Purpose | Example |
|---|---|---|---|
| `DB_NAME` | No | MySQL database name and backend JDBC database | `habit_tracker` |
| `DB_USERNAME` | No | MySQL application user and backend username | `habit_tracker` |
| `DB_PASSWORD` | No | MySQL application password and backend password | `<database-password>` |
| `DB_ROOT_PASSWORD` | No | MySQL root password used by the container | `<root-password>` |
| `DB_URL` | No for local defaults; set for custom backend database | Complete JDBC URL | `jdbc:mysql://localhost:3306/habit_tracker?createDatabaseIfNotExist=true&serverTimezone=UTC` |
| `JPA_DDL_AUTO` | No | Hibernate schema behavior | `update` |
| `SERVER_PORT` | No | Backend HTTP port | `8080` |
| `VITE_API_BASE_URL` | No | Frontend REST API base URL | `http://localhost:8080/api` |

Compose defaults `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, and `DB_ROOT_PASSWORD` when they are not provided. Spring defaults `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JPA_DDL_AUTO`, and `SERVER_PORT` when running outside Compose. Do not commit `.env` files or real credentials.

## 10. Database Setup

The default database is `habit_tracker`. Hibernate creates or updates the schema from the JPA entities because `JPA_DDL_AUTO` defaults to `update`; this project does not use Flyway, Liquibase, or SQL migration files.

The implemented tables are:

- `habits`: name, optional description, frequency (`DAILY`, `WEEKLY`, or `MONTHLY`), creation timestamp, and update timestamp.
- `habit_check_ins`: habit reference, check-in date, and creation timestamp.

`habit_check_ins` has a unique constraint on `(habit_id, check_in_date)`. Deleting a habit cascades to its check-ins through the JPA relationship. Docker persists data in the `mysql-data` named volume until it is removed with `docker compose down --volumes`.

Tests use an isolated in-memory H2 database with `create-drop`; test data is not persisted.

## 11. API Documentation

All application endpoints are under `/api`.

| Method | Endpoint | Description | Success |
|---|---|---|---|
| `GET` | `/api/health` | Return application health text | `200 OK` with `ok` |
| `GET` | `/api/habits` | List all habits | `200 OK` with an array |
| `GET` | `/api/habits/{id}` | Get one habit | `200 OK` with a habit |
| `POST` | `/api/habits` | Create a habit | `201 Created` with a habit |
| `PUT` | `/api/habits/{id}` | Update a habit | `200 OK` with a habit |
| `DELETE` | `/api/habits/{id}` | Delete a habit and its check-ins | `204 No Content` |
| `GET` | `/api/habits/{id}/check-ins` | List check-ins newest first | `200 OK` with an array |
| `POST` | `/api/habits/{id}/check-ins` | Record a check-in | `201 Created` with a check-in |

### Habit request

`POST /api/habits` and `PUT /api/habits/{id}` accept:

```json
{
  "name": "Morning Run",
  "description": "A 5 km run before breakfast",
  "frequency": "DAILY"
}
```

`name` is required and limited to 100 characters. `description` is optional and limited to 500 characters. `frequency` is required and must be `DAILY`, `WEEKLY`, or `MONTHLY`.

Example response:

```json
{
  "id": 1,
  "name": "Morning Run",
  "description": "A 5 km run before breakfast",
  "frequency": "DAILY",
  "createdAt": "2026-09-16T10:00:00Z",
  "updatedAt": "2026-09-16T10:00:00Z",
  "checkInCount": 0
}
```

### Check-in request

`POST /api/habits/{id}/check-ins` accepts a current or past ISO date:

```json
{
  "checkInDate": "2026-09-16"
}
```

Example response:

```json
{
  "id": 1,
  "habitId": 1,
  "checkInDate": "2026-09-16",
  "createdAt": "2026-09-16T10:05:00Z"
}
```

### Error responses

Validation failures, malformed JSON, missing habits, duplicate check-ins, and unexpected errors use this structure:

```json
{
  "timestamp": "2026-09-16T10:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "{name=Name is required}",
  "path": "/api/habits"
}
```

Important status codes are `400 Bad Request` for invalid input or malformed JSON, `404 Not Found` for an unknown habit, `409 Conflict` for duplicate check-ins or database conflicts, `201 Created` for creates, `204 No Content` for successful deletes, and `500 Internal Server Error` for unexpected failures.

## 12. Frontend

The dashboard shows total habits and total check-ins, lists habits with frequency, description, timestamps, and check-in count, and provides create, edit, delete, and check-in actions. Selecting a habit loads its details and check-in history. The form performs client-side checks that match the backend name and description limits, while API errors are displayed after failed requests.

The frontend uses `fetch` through `frontend/src/api/habits.js`. It calls the REST API for initial data, habit details, CRUD operations, and check-ins. The Vite development server is configured for port `5173`; the Docker frontend also binds to `0.0.0.0:5173`.

## 13. Testing

Run the backend context and MockMvc integration tests from the repository root:

```bash
./mvnw clean test
```

The integration test covers create, list, read-by-ID, update, check-in, check-in history, duplicate check-in rejection, delete, and the empty-list result. Tests use H2 and the `test` Spring profile, so a running MySQL instance is not required.

Build the frontend with the lockfile:

```bash
cd frontend
npm ci
npm run build
```

The frontend package currently defines build and development scripts but does not define a frontend test script.

## 14. End-to-End Verification

The implemented backend workflow is covered by the MockMvc integration test: create, read, update, check in, read check-in history, reject a duplicate check-in, delete, and verify the list is empty. The frontend API client is configured to use the backend API, and Compose defines health-gated startup for MySQL, backend, and frontend.

For a local runtime smoke check after starting Compose:

```bash
curl http://localhost:8080/api/health
curl http://localhost:8080/api/habits
curl http://localhost:5173
```

The repository does not contain an automated browser test suite. Manual frontend interaction is therefore separate from the automated backend test suite.

## 15. Troubleshooting

### Docker is not running

Start Docker Desktop or the Docker daemon, then confirm:

```bash
docker info
docker compose version
```

### A port is already in use

The default published ports are `3306`, `8080`, and `5173`. Stop the process using the port or change the Compose port mapping and the corresponding frontend/API configuration. A local Vite server may move to `5174`, but the backend CORS allowlist only includes the configured local ports `5173` and `5174`.

### MySQL connection failure

In Compose, the backend must use the service hostname `mysql`, which is already configured in `compose.yaml`. Outside Compose, use `localhost` in `DB_URL`. Check database credentials and wait for the MySQL health check before starting the backend.

### Backend startup failure

Inspect the container output:

```bash
docker compose logs backend
```

Confirm that Java 17 is installed for local runs, that the database is reachable, and that port `8080` is free. The backend image packages the JAR during `docker compose build` and waits for MySQL before launching it.

### Frontend cannot connect to the backend

Confirm that `http://localhost:8080/api/health` responds, then check `VITE_API_BASE_URL`. For local Vite development it should normally be `http://localhost:8080/api`. Restart the Vite process after changing a Vite environment variable.

### CORS error

The API allows `http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:5174`, and `http://127.0.0.1:5174` for `/api/**`. Use one of those origins or update `WebConfig` for another local origin.

### Java, Node, or Maven version mismatch

Use Java 17, Node 20, and npm 10.x. Use `./mvnw` instead of relying on a globally installed Maven version. The frontend engine constraints are enforced by `frontend/package.json`.

### Maven build failure

Check network access for Maven Central, remove only the affected local Maven cache entry if necessary, and rerun:

```bash
./mvnw clean test
```

### Database persistence issues

Compose stores MySQL data in `mysql-data`. `docker compose down` retains it; `docker compose down --volumes` removes it and resets the database. Do not use the latter when testing restart persistence.

## 16. API / Application Health

`GET /api/health` returns the plain-text response `ok` with HTTP `200`. Compose uses this endpoint as the backend health check before starting the frontend.

## 17. Security and Configuration Notes

- `.env` and other environment files containing credentials are ignored by Git; only example files are committed.
- The Compose defaults are for local development and evaluation. Replace them with non-committed environment values for shared environments.
- CORS is restricted to the four configured local Vite origins rather than allowing all origins.
- Hibernate schema management defaults to `update`. A production deployment should use an explicit migration strategy and deployment-specific secret management; those capabilities are not implemented in this repository.

## 18. Known Limitations

- There is no authentication or user/account isolation.
- There is no automated frontend/browser test suite.
- The frontend Docker image runs the Vite development server rather than a production static server.
- Database schema changes are managed by Hibernate `update`; no versioned migration tool is included.
- Docker Engine and Docker Compose versions are not pinned in repository configuration.

## 19. Future Improvements

The following are future work, not implemented features:

- Add authentication and per-user habit ownership.
- Add automated browser tests.
- Add database migrations with Flyway or Liquibase.
- Add a production frontend image that serves a built static bundle.
- Add CI checks for backend tests, frontend builds, and container startup.

## 20. License

No license file is present in this repository.
