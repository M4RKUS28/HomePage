# Threat model – M4RKUS28/HomePage (www.m4rkus28.de)

Personal portfolio site: public pages (projects, CV, contact form), open user registration, and a single-admin dashboard. Infrastructure is defined in this repository (`docker-compose.yml`, `deploy/docker-compose.prod.yml`, `nginx/`, `cloudpannel/vhost.nginx`, `.github/workflows/docker-build-push.yml`); there is no separate infrastructure repository.

## Components
| Name | Code | Notes |
|---|---|---|
| **Edge proxy** | `nginx/`, `cloudpannel/vhost.nginx` | CloudPanel host nginx (TLS, HSTS) → Docker nginx on `127.0.0.1:8457` → frontend/Garage. Rate limits on `/api/` (10 r/s) and `/` (30 r/s). Proxies `/storage/` (canonical; `/minio/` is a legacy alias) straight to the Garage S3 API. |
| **Web client** | `nextfrontend/src/app/[locale]/**`, `nextfrontend/src/components/**`, `hooks/`, `contexts/` | React 19 / Next.js 16 pages; admin dashboard UI; accent CSS injected via `dangerouslySetInnerHTML` in `[locale]/layout.js`. |
| **BFF / Auth** | `nextfrontend/src/auth.js`, `nextfrontend/src/app/api/**`, `nextfrontend/src/lib/internal-jwt.js`, `lib/server-api.js` | Auth.js v5 credentials provider, JWT session cookie (24 h). Catch-all `/api/[...path]` proxy signs a 30 s HS256 internal JWT (`AUTH_INTERNAL_SHARED_SECRET`) carrying `user_id`/`is_admin` from the session and forwards to FastAPI. `/api/auth/register` forwards to `/internal/register`. |
| **Backend API** | `backend/src/api/**`, `backend/src/services/**`, `backend/src/core/**`, `backend/create_admin.py` | FastAPI. Auth = internal JWT (`core/security.py`, `core/dependencies.py`); `/internal/*` guarded by `X-Internal-Key` == shared secret. Admin-only: projects CRUD, GitHub import (server-side fetch + Gemini), CV import (Gemini), settings, messages, access log, storage upload URLs. User: `/users/me`, avatar upload, own profile update, contact message. IP tracking middleware trusts `X-Forwarded-For`; IPinfo lookups. |
| **Data stores** | `backend/src/db/**`, `backend/alembic/**` | PostgreSQL 16 (users, bcrypt hashes, projects, CV, messages, access logs, settings), Redis 7 (IP dedup cache), Garage (avatars, project covers – public; `cv/<uid>/`, `misc/<uid>/` – owner-scoped; presigned URLs). |
| **Deployment & CI** | `docker-compose.yml`, `deploy/**`, `**/Dockerfile`, `.github/workflows/**`, `.env.example` | Prod compose exposes only nginx (8457); DB/Redis/Garage on the internal bridge network (no S3/RPC/admin host ports). Dev compose publishes Postgres 5432. Images pushed to Docker Hub. |

## Trust boundaries
1. Internet → Edge proxy (anonymous, untrusted).
2. Browser session → BFF: the Auth.js session cookie is the only browser credential; the BFF is trusted to mint internal JWTs.
3. BFF → Backend API: trust rests entirely on `AUTH_INTERNAL_SHARED_SECRET` (both HMAC key and `X-Internal-Key`). Backend is not supposed to be reachable from the internet.
4. Backend → data stores and third parties (GitHub/any URL fetched by project import & health checks, Gemini, IPinfo, SMTP).
5. Browser → Garage via `/storage/` with presigned URLs.

## Entry points
- Anonymous: public pages, `GET /api/projects`, `GET /api/cv`, public settings, `GET /api/users/{id}/avatar`, `/api/auth/*` (login, register), `/storage/*` and legacy `/minio/*` (anything Garage accepts unsigned or presigned; the bucket is private, so objects need presigned URLs).
- Registered user (open registration): `/api/users/me`, `PUT /api/users/{id}`, avatar upload, `POST /api/messages`, `GET /api/storage/download-url/*`, account deletion.
- Admin: everything under projects/CV/settings/messages/access-log/storage upload, GitHub & CV import (outbound requests, LLM).

## Assets (all rated equally important by the owner)
- Admin account and site integrity (defacement, content tampering, stored XSS on public pages).
- Secrets: `AUTH_INTERNAL_SHARED_SECRET`, `AUTH_SECRET`/`SESSION_SECRET`, Garage admin/RPC secrets and S3 key, DB creds, Gemini/IPinfo/SMTP keys.
- Personal data: user emails and password hashes, contact messages, visitor IP/geo access logs (GDPR-relevant).
- Stored files in Garage (private CVs/misc uploads).
- Availability of the site and paid third-party quota (Gemini, IPinfo).

## Attackers (confirmed by owner)
- **Anonymous internet user** – can reach everything behind the edge proxy.
- **Registered non-admin user** – anyone can register; privilege escalation to admin, IDOR on other users, or abusing user-level endpoints are in scope.
- Admin (the owner) is trusted. A compromised admin is not a separate attacker profile.

## Existing controls
- BFF pattern: browser never sees backend JWTs; internal JWTs live 30 s.
- Admin checks via `get_current_admin_user` reading `is_admin` from the DB user (not the token claim).
- `/internal/*` requires the shared key; backend only `expose`d in prod compose.
- S3 object download authorisation in `api/routers/storage.py::_can_access_object` (fail-closed for unknown prefixes); uploads URLs admin-only.
- bcrypt password hashing; nginx rate limiting and security headers; HSTS at CloudPanel; extension deny-list for `.env/.git/.yml/...`.

## Out of scope / accepted risk
- Owner: nothing is out of scope; report everything.

## Open questions
- Is the dev `docker-compose.yml` ever run on an internet-facing host?
- Bucket policy: none needed — the `homepage` bucket is private (Garage has no S3 bucket policies / no anonymous access); all object access requires presigned URLs.
