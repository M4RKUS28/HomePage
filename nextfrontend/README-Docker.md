# Next.js Frontend with PM2 Docker Setup

Dieses Setup erstellt ein Docker Container für das Next.js Frontend mit PM2 für Load Balancing und Process Management.

## Dateien

- `Dockerfile`: Multi-stage Docker build für optimale Größe
- `docker-compose.yml`: Docker Compose Konfiguration mit Umgebungsvariablen
- `ecosystem.config.js`: PM2 Konfiguration für Clustering
- `.env.example`: Beispiel für Umgebungsvariablen
- `.dockerignore`: Ausschluss von unnötigen Dateien beim Build

## Schnellstart

1. **Umgebungsvariablen kopieren:**
   ```bash
   cp .env.example .env
   ```

2. **Umgebungsvariablen anpassen:**
   ```bash
   # .env Datei bearbeiten
   PM2_INSTANCES=4  # Anzahl der PM2 Instanzen
   BACKEND_URL=http://backend:8000
   ```

3. **Container starten:**
   ```bash
   docker-compose up -d --build
   ```

## Konfiguration

### PM2 Instanzen

Die Anzahl der PM2 Instanzen wird über die Umgebungsvariable `PM2_INSTANCES` gesteuert:

- **Empfehlung:** CPU Cores - 1 (z.B. 4 Cores = 3 Instanzen)
- **Minimum:** 1 Instanz
- **Maximum:** Abhängig von verfügbarem RAM

### Umgebungsvariablen

| Variable | Beschreibung | Standard |
|----------|-------------|----------|
| `PM2_INSTANCES` | Anzahl PM2 Instanzen | 2 |
| `BACKEND_URL` | Backend API URL | http://backend:8000 |
| `NODE_ENV` | Node.js Umgebung | production |

## Monitoring

### Container Status
```bash
docker-compose ps
```

### PM2 Status im Container
```bash
docker-compose exec nextfrontend pm2 status
```

### Logs ansehen
```bash
# Container Logs
docker-compose logs -f nextfrontend

# PM2 Logs
docker-compose exec nextfrontend pm2 logs
```

### Health Check
Der Container hat einen eingebauten Health Check, der alle 30 Sekunden prüft ob die Anwendung erreichbar ist.

## Skalierung

### Runtime Skalierung der PM2 Instanzen
```bash
# In den Container wechseln
docker-compose exec nextfrontend sh

# PM2 Instanzen zur Laufzeit ändern
pm2 scale nextjs-app 6
```

### Container Neustart mit neuer Instanz-Anzahl
```bash
# .env anpassen
PM2_INSTANCES=6

# Container neu starten
docker-compose up -d --force-recreate
```

## Performance Tuning

### Memory Limits
Die PM2 Konfiguration beinhaltet:
- Automatischer Restart bei 500MB Speicherverbrauch
- Node.js max_old_space_size auf 400MB begrenzt

### Cluster Mode
PM2 läuft im Cluster-Modus für optimale CPU-Nutzung und automatisches Load Balancing.

## Troubleshooting

### Container startet nicht
```bash
# Build Logs prüfen
docker-compose build --no-cache

# Detaillierte Logs
docker-compose up --no-deps nextfrontend
```

### Hoher Speicherverbrauch
```bash
# PM2 Memory Monitoring
docker-compose exec nextfrontend pm2 monit
```

### Verbindungsprobleme zum Backend
- Backend URL in `.env` prüfen
- Network Konfiguration im docker-compose.yml prüfen
- Backend Container läuft und ist erreichbar
