# ── Stage 1: build the React frontend ──────────────────────────
FROM node:20-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# Uses frontend/.env.production (VITE_API_URL=/api, same-origin)
RUN npm run build

# ── Stage 2: Python backend that also serves the built SPA ──────
FROM python:3.12-slim AS runtime
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    STATIC_DIR=/app/static

WORKDIR /app

# Install backend (deps + the `app` package) from its pyproject.
COPY backend/pyproject.toml /app/backend/pyproject.toml
COPY backend/app /app/backend/app
RUN pip install /app/backend

# Built SPA, served by FastAPI at the app root.
COPY --from=frontend /app/frontend/dist /app/static

EXPOSE 8080
# Cloud Run injects $PORT (defaults to 8080 locally).
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
