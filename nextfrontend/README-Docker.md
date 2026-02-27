# Next.js Frontend – PM2 Docker Setup

Production-Docker-Setup für das Next.js Frontend mit PM2 für Cluster-Modus und Process Management.

## Dateien

| Datei | Beschreibung |
|---|---|
| `Dockerfile` | Multi-stage Production Build (Node 20-alpine, Standalone Output, PM2) |
| `Dockerfile.dev` | Development Build (Hot Reload, Source-Volume-Mounting) |
| `ecosystem.config.js` | PM2 Cluster-Konfiguration |
| `docker-compose.yml` | Lokale Entwicklung (Root-Verzeichnis) |
| `docker-compose.prod.yml` | Produktion mit DockerHub-Images (Root-Verzeichnis) |

## Schnellstart

1. **Umgebungsvariablen konfigurieren** (im Root-Verzeichnis):
   ```bash
   # In der docker-compose.yml / docker-compose.prod.yml
   PM2_INSTANCES=4           # Anzahl der PM2 Instanzen
   BACKEND_URL=http://homepagebackend:8000
   ```

2. **Container starten:**
   ```bash
   # Entwicklung (mit Hot Reload)
   docker compose up --build

   # Produktion
   docker compose -f docker-compose.prod.yml up -d
   ```

## Konfiguration

### PM2 Instanzen

Die Anzahl der PM2 Instanzen wird über die Umgebungsvariable `PM2_INSTANCES` gesteuert:

- **Empfehlung:** CPU Cores - 1 (z.B. 4 Cores = 3 Instanzen)
- **Minimum:** 1 Instanz
- **Standard:** 2 Instanzen (wenn nicht gesetzt)
- **Maximum:** Abhängig von verfügbarem RAM

### PM2 Cluster-Konfiguration (ecosystem.config.js)

| Einstellung | Wert |
|---|---|
| Script | `server.js` (Next.js Standalone Output) |
| Exec Mode | Cluster |
| Max Memory | 500 MB (automatischer Restart) |
| Node max_old_space_size | 400 MB |
| Max Restarts | 10 |

### Umgebungsvariablen

| Variable | Beschreibung | Standard |
|---|---|---|
| `PM2_INSTANCES` | Anzahl PM2 Instanzen | 2 |
| `BACKEND_URL` | Backend API URL | http://homepagebackend:8000 |
| `NODE_ENV` | Node.js Umgebung | production |
| `AUTH_SECRET` | Auth.js Secret | – |
| `AUTH_INTERNAL_SHARED_SECRET` | Shared Secret mit Backend | – |
| `INTERNAL_API_KEY` | Interner API-Key für Backend | – |

## Docker Build Stages (Production)

1. **deps** – `npm ci --omit=dev` (nur Production-Dependencies)
2. **builder** – `npm run build` (Standalone Output)
3. **runner** – Non-root User `nextjs:nodejs`, PM2 global installiert
4. **CMD** – `pm2-runtime start ecosystem.config.js`

## Monitoring

### Container Status
```bash
docker compose ps
```

### PM2 Status im Container
```bash
docker compose exec nextfrontend pm2 status
```

### Logs ansehen
```bash
# Container Logs
docker compose logs -f nextfrontend

# PM2 Logs
docker compose exec nextfrontend pm2 logs

# Produktions-Logs (Host-Verzeichnis)
# Gemountet via docker-compose.prod.yml → ./nextfrontend/logs:/app/logs
```

### Health Check
Der Container hat einen eingebauten Health Check, der alle 30 Sekunden prüft ob die Anwendung erreichbar ist.

## Skalierung

### Runtime Skalierung der PM2 Instanzen
```bash
# In den Container wechseln
docker compose exec nextfrontend sh

# PM2 Instanzen zur Laufzeit ändern
pm2 scale nextjs-app 6
```

### Container Neustart mit neuer Instanz-Anzahl
```bash
# PM2_INSTANCES in docker-compose.prod.yml anpassen
PM2_INSTANCES=6

# Container neu starten
docker compose -f docker-compose.prod.yml up -d --force-recreate nextfrontend
```

## Performance Tuning

### Memory Limits
Die PM2 Konfiguration beinhaltet:
- Automatischer Restart bei 500 MB Speicherverbrauch pro Instanz
- Node.js `max_old_space_size` auf 400 MB begrenzt

### Cluster Mode
PM2 läuft im Cluster-Modus für optimale CPU-Nutzung und automatisches Load Balancing zwischen den Instanzen.

## Troubleshooting

### Container startet nicht
```bash
# Build Logs prüfen
docker compose build --no-cache nextfrontend

# Detaillierte Logs
docker compose up --no-deps nextfrontend
```

### Hoher Speicherverbrauch
```bash
# PM2 Memory Monitoring
docker compose exec nextfrontend pm2 monit
```

### Verbindungsprobleme zum Backend
- `BACKEND_URL` in der Docker-Compose-Konfiguration prüfen
- Backend-Container muss im selben Docker-Netzwerk (`app-network`) laufen
- Backend-Container muss healthy sein (Health Check)
