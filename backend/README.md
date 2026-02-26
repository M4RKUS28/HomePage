# Backend – FastAPI

Async REST API für die Homepage. Läuft zusammen mit PostgreSQL, Redis und MinIO im Docker-Netzwerk. NextJS ist das einzige Frontend – es kommuniziert intern über einen Shared Secret JWT (keine öffentlichen Auth-Endpoints).

---

## Technologie-Stack

| Komponente | Version |
|---|---|
| Python | 3.12 |
| FastAPI | latest |
| SQLAlchemy | 2.0 (async, asyncpg) |
| PostgreSQL | 16 |
| Redis | 7 |
| MinIO | latest |
| Alembic | Migrationen |

---

## Verzeichnisstruktur

```
backend/
├── src/                        # Produktionscode
│   ├── main.py                 # App-Factory, Lifespan, Scheduler
│   ├── core/
│   │   ├── config.py           # Pydantic Settings (liest .env)
│   │   ├── security.py         # JWT-Validierung, Passwort-Hashing
│   │   └── dependencies.py     # FastAPI-Dependencies (get_current_user etc.)
│   ├── db/
│   │   ├── session.py          # AsyncEngine + AsyncSessionLocal
│   │   ├── redis.py            # Redis-Connectionpool
│   │   ├── minio.py            # MinIO-Client
│   │   ├── base.py             # SQLAlchemy DeclarativeBase
│   │   ├── models/             # ORM-Modelle (User, Project, CV, Message)
│   │   └── crud/               # CRUD-Funktionen (kein HTTP-Bezug)
│   ├── services/               # Business-Logic (user, project, cv, message)
│   └── api/
│       ├── router.py           # Zentraler API-Router
│       ├── routers/            # Endpoints (users, projects, cv, messages, internal, storage)
│       └── schemas/            # Pydantic-Schemas
├── alembic/                # Datenbankmigrationen
├── alembic.ini
├── create_admin.py             # CLI-Skript: Admin-User manuell erstellen
├── .env                        # Lokale Umgebungsvariablen (nicht committen!)
├── .env.example                # Vorlage
├── Dockerfile
└── entrypoint.sh
```

---

## Auth-Architektur (BFF / Service-to-Service)

```
Browser  ←──────────────────────────────────  NextJS
         hp_session Cookie (iron-session)
         (encrypted, opaque – kein JWT)

NextJS   ──── Bearer JWT (30s TTL, HS256) ──►  FastAPI
              AUTH_INTERNAL_SHARED_SECRET
```

- Der Browser sieht **niemals** ein FastAPI-JWT
- NextJS signiert pro Request einen kurzlebigen Token mit `AUTH_INTERNAL_SHARED_SECRET`
- FastAPI validiert nur den Token – keine eigenen Login/Register-Endpoints für den Browser
- Die Endpoints `/internal/login` und `/internal/register` sind nur über `X-Internal-Key` erreichbar (nur NextJS kennt den Key)

---

## Konfiguration

Kopiere `.env.example` nach `.env` und passe die Werte an:

```bash
cp .env.example .env
```

Wichtige Variablen:

| Variable | Beschreibung |
|---|---|
| `DB_*` | PostgreSQL-Verbindung |
| `REDIS_*` | Redis-Verbindung |
| `MINIO_*` | MinIO Objektspeicher |
| `AUTH_INTERNAL_SHARED_SECRET` | Shared Secret mit NextJS (muss identisch sein!) |
| `ADMIN_USERNAME/EMAIL/PASSWORD` | Wird beim ersten Start automatisch angelegt |
| `EMAIL_*` | SMTP-Konfiguration für ausgehende Mails |

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
python run_dev.py
# oder:
uvicorn src.main:app --reload --port 8000
```

API-Dokumentation: http://localhost:8000/api/docs

---

## Docker

```bash
# Mit docker-compose.yml starten
docker compose -f docker-compose.yml up --build

# Nur den Backend-Container neu bauen
docker compose -f docker-compose.yml up --build homepagebackend
```

---

## API-Endpoints Übersicht

| Prefix | Beschreibung | Auth |
|---|---|---|
| `GET /api/cv/` | CV-Daten abrufen | öffentlich |
| `PUT /api/cv/` | CV-Daten aktualisieren | Admin |
| `GET /api/users/me` | Eigenes Profil | JWT |
| `GET /api/users/` | Alle User | Admin |
| `PUT /api/users/{id}` | User aktualisieren | JWT (self or admin) |
| `POST /api/users/me/avatar` | Avatar hochladen | JWT |
| `GET /api/projects/` | Projekte auflisten | öffentlich |
| `POST /api/projects/` | Projekt erstellen | Admin |
| `POST /api/messages/` | Kontaktanfrage senden | öffentlich |
| `GET /api/messages/` | Nachrichten lesen | Admin |
| `POST /api/storage/upload-url` | Presigned Upload-URL | JWT |
| `POST /internal/login` | Login (nur NextJS) | X-Internal-Key |
| `POST /internal/register` | Registrierung (nur NextJS) | X-Internal-Key |
