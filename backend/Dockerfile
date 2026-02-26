# ---------- builder stage ----------
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /usr/src/app

RUN pip install --upgrade pip

COPY requirements.txt ./requirements.txt
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /usr/src/app/wheels -r requirements.txt


# ---------- final stage ----------
FROM python:3.12-slim

RUN addgroup --system app && adduser --system --group app

# curl is needed for Docker healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

WORKDIR /home/app/web

# Install pre-built wheels
COPY --from=builder /usr/src/app/wheels /wheels
COPY --from=builder /usr/src/app/requirements.txt .
RUN pip install --no-cache /wheels/*

# Copy application source (src → app inside the container)
COPY ./src ./app

# Copy Alembic configuration
COPY ./alembic.ini ./alembic.ini
COPY ./alembic ./alembic

# Copy entrypoint
COPY ./entrypoint.sh ./entrypoint.sh

RUN chown -R app:app /home/app/web && chmod +x /home/app/web/entrypoint.sh

USER app

EXPOSE 8000

ENTRYPOINT ["/home/app/web/entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
