@echo off
setlocal

cd /d "%~dp0"

where docker >nul 2>nul
if errorlevel 1 (
  echo Docker is required but not installed or not on PATH.
  exit /b 1
)

docker compose version >nul 2>nul
if errorlevel 1 (
  echo Docker Compose is required but not available.
  exit /b 1
)

echo Starting Habit Tracker stack...
docker compose down --remove-orphans --volumes
if errorlevel 1 (
  echo Failed to stop existing stack.
  exit /b 1
)
docker compose up --build
if errorlevel 1 (
  echo Docker stack failed to start.
  exit /b 1
)
