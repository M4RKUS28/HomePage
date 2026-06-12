# M4RKUS-HP – Personal Portfolio Website

Vollständige Fullstack-Webanwendung für eine persönliche Portfolio-Homepage mit Admin-Dashboard, Projekt-Showcase, interaktivem CV und Kontaktformular.

🔗 **Live:** [https://www.m4rkus28.de](https://www.m4rkus28.de/)

---

## Architektur

```
Browser ──► Nginx (Reverse Proxy, Rate Limiting, Security Headers)
               ├── / ──────────► Next.js 16 (React 19, SSR, Auth.js v5)
               └── /api/ ──────► Next.js API Routes ──► FastAPI (Python 3.12)
                                      ▲                       │
                                      │ iron-session           │ async
                                      │ (verschlüsseltes      ├── PostgreSQL 16
                                      │  Session-Cookie)       ├── Redis 7
                                      │                        └── MinIO (S3)
                                 Browser
```

**Auth-Flow (BFF-Pattern):**
Der Browser sieht niemals ein FastAPI-JWT. Next.js verwaltet die Session über verschlüsselte Auth.js-Cookies und signiert pro Backend-Request einen kurzlebigen internen JWT mit einem Shared Secret.

---

## Tech-Stack

| Schicht | Technologie | Details |
|---|---|---|
| **Frontend** | Next.js 16, React 19 | Tailwind CSS 4, Framer Motion, Auth.js v5, Turbopack (Dev) |
| **Backend** | FastAPI, Python 3.12 | Async SQLAlchemy + asyncpg, Alembic Migrationen, APScheduler |
| **Datenbank** | PostgreSQL 16 | Health-checked, persistentes Volume |
| **Cache** | Redis 7 | LRU-Eviction, async Client |
| **Objektspeicher** | MinIO | S3-kompatibel, Presigned URLs für Uploads |
| **Reverse Proxy** | Nginx | Rate Limiting, Security Headers, Static-File-Caching |
| **Process Manager** | PM2 | Cluster-Modus in Produktion |
| **Container** | Docker Compose | Getrennte Dev/Prod-Konfigurationen |

---

## Features

- **🎨 Modernes UI/UX** – Responsives Design mit Dark/Light Mode, Partikel-Hintergrund
- **🔐 Authentifizierung** – Sicheres Login & Registrierung via Auth.js v5 (Credentials Provider)
- **📂 Projekt-Showcase** – Projekte mit Status-Monitoring und Detailansichten
- **📝 Interaktiver CV** – Skills, Erfahrung und Ausbildung als editierbare Sektion
- **📫 Kontaktformular** – Nachrichten mit E-Mail-Benachrichtigung (aiosmtplib)
- **📊 Admin-Dashboard** – Projekte, Nachrichten, User und CV verwalten
- **🖼️ Datei-Upload** – Avatar- und Bild-Upload über MinIO mit Presigned URLs
- **⚡ Animationen** – Flüssige Übergänge und Interaktionen mit Framer Motion
- **🛡️ Sicherheit** – Rate Limiting, Security Headers, verschlüsselte Sessions, CORS

---

## Projektstruktur

```
M4RKUS-HP/
├── backend/              # FastAPI REST API (Python 3.12)
│   ├── src/              #   Produktionscode (api, core, db, services)
│   ├── alembic/          #   Datenbankmigrationen
│   └── Dockerfile        #   Multi-stage Build
├── nextfrontend/         # Next.js 16 Frontend
│   ├── src/              #   App Router, Komponenten, API-Client
│   │   ├── app/          #   Pages & API Routes
│   │   ├── components/   #   React-Komponenten (Admin, Auth, Home, UI, User)
│   │   └── api/          #   Backend API Client (axios)
│   ├── Dockerfile        #   Production Build (PM2)
│   └── Dockerfile.dev    #   Development Build (Hot Reload)
├── nginx/                # Reverse Proxy Konfiguration
├── deploy/               # Produktion: compose + start/stop/update Scripts
├── docker-compose.yml    # Lokale Entwicklung
└── .env.example          # Vorlage für die EINE .env (Repo-Root)
```

---

## Schnellstart (Lokale Entwicklung)

### Voraussetzungen

- Docker & Docker Compose
- Git

### 1. Repository klonen

```bash
git clone <repo-url>
cd M4RKUS-HP
```

### 2. Umgebungsvariablen konfigurieren

Es gibt genau **eine** `.env` im Repo-Root — sie versorgt Compose, Backend
und Frontend:

```bash
cp .env.example .env
# .env anpassen (DB, MinIO, Secrets, Admin-Credentials, E-Mail, …)
```

### 3. Starten

```bash
docker compose up --build
```

### 4. Aufrufen

| Service | URL |
|---|---|
| **Website** | [http://localhost:8457](http://localhost:8457) |
| **API Docs (Swagger)** | [http://localhost:8457/api/docs](http://localhost:8457/api/docs) |
| **MinIO Console** | [http://localhost:9001](http://localhost:9001) |

---

## Produktion

Alles für den Server liegt in [`deploy/`](deploy/README.md):

```bash
cp .env.example .env   # einmalig auf dem Server, Werte ausfüllen (AUTH_URL=https://…)
deploy/start.sh        # pull + start, Autostart bei Reboot, stündliches Auto-Update
deploy/stop.sh         # Stack stoppen (Daten bleiben erhalten)
```

Images werden per CI/CD auf DockerHub gepusht:
- `${DOCKERHUB_USERNAME}/m4rkus-backend:latest`
- `${DOCKERHUB_USERNAME}/m4rkus-frontend:latest`
- `${DOCKERHUB_USERNAME}/m4rkus-nginx:latest`

---

## Umgebungsvariablen

| Variable | Beschreibung |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL-Verbindung |
| `REDIS_HOST`, `REDIS_PORT` | Redis-Verbindung |
| `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` | MinIO Object Storage |
| `AUTH_INTERNAL_SHARED_SECRET` | Shared Secret zwischen Next.js und FastAPI |
| `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Initialer Admin-User (Seed) |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD` | SMTP für ausgehende E-Mails |
| `BACKEND_URL` | Interne Backend-URL für Next.js (z.B. `http://homepagebackend:8000`) |
| `PM2_INSTANCES` | Anzahl PM2-Instanzen in Produktion |

---

## Weiterführende Dokumentation

| Dokument | Beschreibung |
|---|---|
| [backend/README.md](backend/README.md) | Backend-Architektur, API-Endpoints, Alembic-Migrationen |
| [nextfrontend/README.md](nextfrontend/README.md) | Frontend-Architektur, Komponenten, Auth-Flow |
| [nextfrontend/README-Docker.md](nextfrontend/README-Docker.md) | PM2 Docker-Setup, Skalierung, Monitoring |
