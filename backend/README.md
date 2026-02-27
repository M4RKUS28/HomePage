# Backend – FastAPI

Async REST API für die Portfolio-Homepage. Läuft zusammen mit PostgreSQL, Redis und MinIO im Docker-Netzwerk. Next.js ist das einzige Frontend – es kommuniziert intern über einen Shared-Secret-JWT (keine öffentlichen Auth-Endpoints).

---

## Technologie-Stack

| Komponente | Beschreibung |
|---|---|
| Python 3.12 | Laufzeitumgebung |
| FastAPI | Async Web-Framework mit automatischer OpenAPI-Doku |
| SQLAlchemy 2.0 | Async ORM (asyncpg Driver) |
| Alembic | Datenbankmigrationen |
| PostgreSQL 16 | Relationale Datenbank |
| Redis 7 | Caching (LRU-Eviction, async Client) |
| MinIO | S3-kompatibler Objektspeicher (Presigned URLs) |
| Pydantic v2 | Settings-Management & Request/Response-Schemas |
| python-jose | JWT-Validierung (HS256) |
| passlib + bcrypt | Passwort-Hashing |
| aiosmtplib | Async E-Mail-Versand |
| APScheduler | Background-Tasks (z.B. Status-Monitoring) |
| httpx | Async HTTP-Client (Health Checks) |

---

## Verzeichnisstruktur

```
backend/
├── src/                        # Produktionscode
│   ├── main.py                 # App-Factory, Lifespan, CORS, Router-Mount
│   ├── core/
│   │   ├── config.py           # Pydantic Settings (liest .env, gruppiert in Nested Models)
│   │   ├── security.py         # JWT-Validierung, Passwort-Hashing
│   │   ├── dependencies.py     # FastAPI-Dependencies (get_current_user, get_admin etc.)
│   │   └── lifespan.py         # Startup/Shutdown (DB-Init, Redis, MinIO, Scheduler)
│   ├── db/
│   │   ├── session.py          # AsyncEngine + AsyncSessionLocal
│   │   ├── redis.py            # Redis-Connectionpool
│   │   ├── minio.py            # MinIO-Client
│   │   ├── base.py             # SQLAlchemy DeclarativeBase
│   │   ├── models/             # ORM-Modelle (User, Project, CV, Message)
│   │   └── crud/               # CRUD-Funktionen (kein HTTP-Bezug)
│   ├── services/               # Business-Logic (user, project, cv, message, email)
│   ├── utils/                  # Hilfsfunktionen (helpers.py)
│   └── api/
│       ├── router.py           # Zentraler API-Router
│       ├── routers/            # Endpoints (users, projects, cv, messages, internal, storage)
│       └── schemas/            # Pydantic-Schemas (Request/Response Modelle)
├── alembic/                    # Datenbankmigrationen
│   └── versions/               # Migrations-Dateien
├── alembic.ini
├── create_admin.py             # CLI-Skript: Admin-User manuell erstellen
├── bmw_job_notifier.py         # Job-Benachrichtigungs-Script
├── .env                        # Lokale Umgebungsvariablen (nicht committen!)
├── .env.example                # Vorlage
├── requirements.txt
├── Dockerfile                  # Multi-stage Build (Python 3.12-slim)
└── entrypoint.sh               # Alembic migrate + exec CMD
```

---

## Auth-Architektur (BFF / Service-to-Service)

```
Browser  ←──────────────────────────────────  Next.js (Auth.js v5)
         Verschlüsseltes Session-Cookie
         (Auth.js, opaque – kein JWT sichtbar)

Next.js  ──── Bearer JWT (60min TTL, HS256) ──►  FastAPI
               AUTH_INTERNAL_SHARED_SECRET
```

- Der Browser sieht **niemals** ein FastAPI-JWT
- Next.js signiert pro Request einen kurzlebigen Token mit `AUTH_INTERNAL_SHARED_SECRET`
- FastAPI validiert nur den Token – keine eigenen Login/Register-Endpoints für den Browser
- Die Endpoints `/internal/login` und `/internal/register` sind nur über `X-Internal-Key` erreichbar (nur Next.js kennt den Key)

---

## Konfiguration

Kopiere `.env.example` nach `.env` und passe die Werte an:

```bash
cp .env.example .env
```

### Konfigurationsgruppen (Pydantic Settings)

| Prefix | Beschreibung |
|---|---|
| `DB_*` | PostgreSQL-Verbindung (Host, Port, User, Password, Name) |
| `REDIS_*` | Redis-Verbindung |
| `MINIO_*` | MinIO Objektspeicher (Endpoint, Bucket, Access/Secret Key) |
| `AUTH_*` | Shared Secret mit Next.js (muss identisch sein!), Token-Lifetime |
| `ADMIN_*` | Initialer Admin-User (Username, Email, Password – Seed beim Start) |
| `EMAIL_*` | SMTP-Konfiguration für ausgehende Mails (aiosmtplib) |
| `PW_*` | Passwort-Policy (Min-Länge, Großbuchstaben, Kleinbuchstaben, Ziffern) |

---

## Datenbankmigrationen (Alembic)

```bash
# Neue Migration erstellen
alembic -c alembic.ini revision --autogenerate -m "beschreibung"

# Migrationen anwenden
alembic -c alembic.ini upgrade head

# Status prüfen
alembic -c alembic.ini current
```

> **Hinweis:** Die `entrypoint.sh` führt `alembic upgrade head` automatisch beim Container-Start aus.

---

## Admin-User manuell erstellen

Falls der automatische Seed (via `ADMIN_*` Env-Variablen) nicht ausreicht:

```bash
# Aus dem backend/ Verzeichnis:
python create_admin.py --username admin --email admin@example.com --password sicheresPasswort
```

---

## Lokale Entwicklung

```bash
# Abhängigkeiten installieren
pip install -r requirements.txt

# Dev-Server starten (mit Auto-Reload)
uvicorn src.main:app --reload --port 8000
```

API-Dokumentation: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)

---

## Docker

```bash
# Mit docker-compose.yml starten (alle Services)
docker compose up --build

# Nur den Backend-Container neu bauen
docker compose up --build homepagebackend
```

### Dockerfile (Multi-stage)

1. **Builder-Stage:** pip-wheel aller Requirements
2. **Final-Stage:** Non-root `app`-User, curl (Health Checks), Wheels + Source + Alembic
3. **Entrypoint:** `alembic upgrade head` → `uvicorn --workers 2`

---

## API-Endpoints Übersicht

### Öffentliche Endpoints

| Methode | Pfad | Beschreibung |
|---|---|---|
| `GET` | `/api/cv/` | CV-Daten abrufen |
| `GET` | `/api/projects/` | Projekte auflisten |
| `POST` | `/api/messages/` | Kontaktanfrage senden |
| `GET` | `/` | Health-Check |

### Authentifizierte Endpoints (JWT)

| Methode | Pfad | Beschreibung | Berechtigung |
|---|---|---|---|
| `GET` | `/api/users/me` | Eigenes Profil | Authentifiziert |
| `PUT` | `/api/users/{id}` | User aktualisieren | Self oder Admin |
| `POST` | `/api/users/me/avatar` | Avatar hochladen | Authentifiziert |
| `POST` | `/api/storage/upload-url` | Presigned Upload-URL | Authentifiziert |

### Admin-Endpoints

| Methode | Pfad | Beschreibung |
|---|---|---|
| `PUT` | `/api/cv/` | CV-Daten aktualisieren |
| `GET` | `/api/users/` | Alle User auflisten |
| `POST` | `/api/projects/` | Projekt erstellen |
| `PUT` | `/api/projects/{id}` | Projekt aktualisieren |
| `DELETE` | `/api/projects/{id}` | Projekt löschen |
| `GET` | `/api/messages/` | Nachrichten lesen |

### Interne Endpoints (nur Next.js via X-Internal-Key)

| Methode | Pfad | Beschreibung |
|---|---|---|
| `POST` | `/internal/login` | Login |
| `POST` | `/internal/register` | Registrierung |
