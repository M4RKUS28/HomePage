# Deployment

Everything needed to run the stack on the server lives in this folder.
Configuration is a **single** `.env` file at the **repo root** (not in here).

## First-time server setup

```bash
git clone <repo-url> && cd M4RKUS-HP
cp .env.example .env
nano .env          # fill in real values; set AUTH_URL=https://www.m4rkus28.de
deploy/start.sh
```

`start.sh` does three things:

1. Pulls the latest images from DockerHub and starts the stack (detached).
2. Enables the Docker daemon on boot — together with `restart: always` on
   every service, the app comes back automatically after a server reboot.
3. Installs an **hourly cron job** running `update.sh`: pulls new images and
   recreates only the containers whose image changed (zero-touch deploys —
   push to `main`, CI builds the images, the server picks them up within an
   hour). Output goes to `deploy/update.log`.

## Scripts

| Script | Purpose |
|---|---|
| `start.sh` | Pull + start stack, enable boot autostart, install hourly auto-update |
| `update.sh` | Pull images, recreate changed containers, prune old images (cron + manual) |
| `stop.sh` | Stop the stack and remove the auto-update cron (volumes/data are kept) |

Logs / status:

```bash
docker compose --env-file ../.env -f docker-compose.prod.yml logs -f --tail=100
docker compose --env-file ../.env -f docker-compose.prod.yml ps
```

## Notes

- Images are built and pushed by CI (`.github/workflows/docker-build-push.yml`)
  on every push to `main` that touches `backend/`, `nextfrontend/` or `nginx/`.
  The server never builds anything.
- All frontend configuration is **runtime** env (no `NEXT_PUBLIC_*` build-time
  values), so the same image works in every environment — values come from the
  root `.env` via `docker-compose.prod.yml`.
- DB migrations run automatically on backend start (alembic in entrypoint).
- The stack listens on port **8457** (nginx) — put your host reverse proxy /
  TLS termination in front of it.
