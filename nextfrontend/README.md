# Frontend – Next.js 16

Server-Side-Rendered Portfolio-Frontend mit React 19, Tailwind CSS 4, Auth.js v5 und Framer Motion. Agiert als BFF (Backend-for-Frontend) und kommuniziert intern mit der FastAPI-Backend-API.

---

## Technologie-Stack

| Komponente | Details |
|---|---|
| Next.js 16 | App Router, SSR, Standalone Output, Turbopack (Dev) |
| React 19 | Client & Server Components |
| Tailwind CSS 4 | Utility-first CSS mit PostCSS |
| Auth.js v5 | Credentials Provider, JWT-Session, verschlüsselte Cookies |
| Framer Motion | Animationen & Transitions |
| Axios | HTTP-Client für Backend-Kommunikation |
| Lucide React | Icon-Bibliothek |
| date-fns | Datumsformatierung |
| PM2 | Cluster-Mode Process Manager (Produktion) |

---

## Verzeichnisstruktur

```
nextfrontend/
├── src/
│   ├── auth.js                 # Auth.js v5 Konfiguration (Credentials Provider)
│   ├── proxy.js                # Server-Side Proxy-Logik
│   ├── api/                    # Backend API Client
│   │   ├── client.js           #   Axios-Instanz mit Interceptors
│   │   ├── cv.js               #   CV-Endpoints
│   │   ├── messages.js         #   Nachrichten-Endpoints
│   │   ├── projects.js         #   Projekt-Endpoints
│   │   ├── storage.js          #   Upload/Storage-Endpoints
│   │   ├── users.js            #   User-Endpoints
│   │   └── index.js            #   Re-Exports
│   ├── app/                    # Next.js App Router
│   │   ├── layout.js           #   Root Layout (Fonts, Metadata, SSR CV-Fetch)
│   │   ├── page.js             #   Homepage (Hero, Projects, CV, CTA)
│   │   ├── globals.css         #   Globale Styles (Tailwind)
│   │   ├── not-found.js        #   404-Seite
│   │   ├── login/page.js       #   Login-Seite
│   │   ├── register/page.js    #   Registrierungs-Seite
│   │   ├── dashboard/page.js   #   User-Dashboard
│   │   ├── admin/page.js       #   Admin-Dashboard
│   │   └── api/                #   API Routes (Auth Callback, Proxy)
│   │       ├── auth/           #     Auth.js Handler + Register-Route
│   │       └── [...path]/      #     Catch-All Proxy → FastAPI
│   ├── components/
│   │   ├── Admin/              # Admin-Komponenten
│   │   │   ├── CVEditor.jsx    #   CV-Editor mit Unterkomponenten
│   │   │   ├── CVEditorParts/  #   Modulare CV-Editor-Teile
│   │   │   ├── MessageList.jsx #   Nachrichten-Verwaltung
│   │   │   ├── ProjectForm.jsx #   Projekt-Erstellung/Bearbeitung
│   │   │   └── UserManagement.jsx # User-Verwaltung
│   │   ├── Auth/               # Authentifizierung
│   │   │   ├── LoginForm.jsx   #   Login-Formular
│   │   │   ├── RegisterForm.jsx #  Registrierungs-Formular
│   │   │   ├── ProtectedRoute.js # Route-Guard (authentifiziert)
│   │   │   └── AdminRoute.js   #   Route-Guard (Admin)
│   │   ├── Core/               # Layout-Komponenten
│   │   │   ├── Navbar.jsx      #   Navigation mit Auth-State
│   │   │   └── Footer.jsx      #   Footer mit Social Links
│   │   ├── Home/               # Homepage-Sektionen
│   │   │   ├── HeroSection.jsx #   Hero mit Profilbild & animiertem Text
│   │   │   ├── ProjectsGrid.jsx #  Projekt-Karten Raster
│   │   │   ├── ProjectCard.jsx #   Einzelne Projekt-Karte
│   │   │   ├── InteractiveCV.jsx # Interaktiver Lebenslauf
│   │   │   └── RegisterCallout.jsx # Registrierungs-CTA
│   │   ├── UI/                 # Wiederverwendbare UI-Komponenten
│   │   │   ├── AnimatedTextCharacter.jsx
│   │   │   ├── BackgroundParticles.jsx
│   │   │   ├── ErrorMessage.jsx
│   │   │   ├── ImageUpload.jsx
│   │   │   ├── LoadingButton.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Spinner.jsx
│   │   │   ├── ThemeToggle.jsx
│   │   │   └── ToastNotification.jsx
│   │   ├── User/               # User-Komponenten
│   │   │   └── MessageForm.jsx #   Kontaktformular
│   │   └── Providers.jsx       # Context-Provider Wrapper
│   ├── contexts/               # React Contexts
│   │   ├── ThemeContext.jsx    #   Dark/Light Mode
│   │   └── ToastContext.jsx   #   Toast-Benachrichtigungen
│   ├── hooks/                  # Custom Hooks
│   │   ├── useAuth.js         #   Auth-State
│   │   └── useTheme.js        #   Theme-State
│   ├── layouts/
│   │   └── MainLayout.jsx     # Haupt-Layout (Navbar + Footer)
│   ├── lib/                    # Server-Side Utilities
│   │   ├── error-utils.js     #   Fehlerbehandlung
│   │   ├── internal-jwt.js    #   JWT-Signierung für Backend-Requests
│   │   └── server-api.js      #   Server-seitiger API-Client
│   └── assets/                 # Statische Assets (Bilder)
├── public/                     # Öffentliche statische Dateien
├── next.config.mjs             # Next.js Konfiguration (Standalone, Image Remotes)
├── ecosystem.config.js         # PM2 Cluster-Konfiguration
├── package.json
├── postcss.config.mjs
├── eslint.config.mjs
├── jsconfig.json
├── Dockerfile                  # Production (Multi-stage, PM2)
└── Dockerfile.dev              # Development (Hot Reload)
```

---

## Auth-Architektur

```
Browser ──── Login ────► Next.js API Route (/api/auth)
                              │
                              ▼
                         Auth.js v5 (Credentials Provider)
                              │
                              │ POST /internal/login
                              │ X-Internal-Key Header
                              ▼
                         FastAPI Backend
                              │
                              ▼
                         User validiert
                              │
                              ▼
                    Auth.js erstellt verschlüsseltes
                    Session-Cookie (JWT-Strategie, 24h)
                              │
                              ▼
                    Browser erhält httpOnly Cookie
```

**Wichtig:**
- Der Browser sieht niemals ein Backend-JWT
- Next.js API-Routes signieren pro Backend-Request einen internen JWT mit `AUTH_INTERNAL_SHARED_SECRET`
- Auth.js verwaltet Session-State (userId, username, email, isAdmin, avatarUrl etc.)
- Client-seitige Session-Updates werden unterstützt (z.B. nach Profil-Bearbeitung)

---

## Seiten

| Route | Beschreibung | Auth |
|---|---|---|
| `/` | Homepage (Hero, Projekte, CV, CTA) | Öffentlich |
| `/login` | Login-Seite | Öffentlich |
| `/register` | Registrierung | Öffentlich |
| `/dashboard` | User-Dashboard | Authentifiziert |
| `/admin` | Admin-Dashboard (Projekte, Nachrichten, CV, User) | Admin |

---

## Lokale Entwicklung

```bash
# Abhängigkeiten installieren
npm install

# Dev-Server starten (Turbopack)
npm run dev
```

Erreichbar unter [http://localhost:3000](http://localhost:3000)

### Umgebungsvariablen

| Variable | Beschreibung |
|---|---|
| `BACKEND_URL` | Interne Backend-URL (z.B. `http://homepagebackend:8000`) |
| `AUTH_SECRET` | Auth.js Encryption Secret |
| `AUTH_INTERNAL_SHARED_SECRET` | Shared Secret für interne JWTs (= Backend-Wert) |
| `INTERNAL_API_KEY` | X-Internal-Key für `/internal/*` Endpoints |

---

## Docker

### Development

```bash
# Über docker-compose.yml (mit Hot Reload)
docker compose up --build nextfrontend
```

- Nutzt `Dockerfile.dev` mit Node 20-alpine
- Source-Code wird per Volume gemountet
- `WATCHPACK_POLLING=true` für WSL-Kompatibilität

### Production

```bash
# Über docker-compose.prod.yml
docker compose -f docker-compose.prod.yml up -d
```

- Multi-stage Build (`Dockerfile`) mit Standalone Output
- PM2 Cluster-Modus für Load Balancing
- Konfigurierbar über `PM2_INSTANCES` Env-Variable

Weitere Details zum PM2-Setup: [README-Docker.md](README-Docker.md)

---

## Scripts

| Script | Beschreibung |
|---|---|
| `npm run dev` | Development Server mit Turbopack |
| `npm run build` | Production Build |
| `npm run start` | Production Server starten |
| `npm run lint` | ESLint ausführen |
