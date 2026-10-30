# Garage object storage

The stack uses [Garage](https://garagehq.deuxfleurs.fr/) (`dxflrs/garage:v2.5.0`)
as the S3-compatible object store instead of MinIO. The backend talks to it
through the MinIO Python SDK used as a generic S3 client.

## Layout

- Single node, `replication_factor = 1`, SQLite metadata — **no redundancy**;
  the `deploy_garage_data` and `deploy_garage_metadata` volumes together
  are the only copy of the objects, so back both up.
- `deploy/garage.toml` is bind-mounted read-only; all secrets come from env.
- Ports: S3 API `3900` (internal network only), RPC `3901`, admin `127.0.0.1:3903`
  (inside the container only). Nothing is published to the host.

## Provisioning

`server --single-node --default-bucket` configures the node layout and creates
the default bucket + access key idempotently from:

| env | purpose |
|---|---|
| `GARAGE_RPC_SECRET` | cluster secret (`openssl rand -hex 32`) |
| `GARAGE_ADMIN_TOKEN` | admin API token (`openssl rand -hex 32`) |
| `GARAGE_DEFAULT_ACCESS_KEY` / `GARAGE_DEFAULT_SECRET_KEY` | default S3 key (`GK`+32 hex / 64 hex) |
| `GARAGE_DEFAULT_BUCKET` | default bucket (`homepage`) |

The backend **requires the bucket to already exist** (no auto-create); startup
fails fast with a clear error otherwise.

## URLs

- Browser-facing presigned URLs are rewritten to `S3_PUBLIC_URL`
  (`https://<host>/storage`), which nginx proxies to `garage:3900` with
  `Host: garage:3900` — matching the host the signature was computed for.
  `/minio/` remains as a legacy alias for persisted old paths.
- Garage does not aim for full S3 compatibility; we only use plain
  presigned GET/PUT plus `stat`/`remove`/`put_object`.

## Migration & rollback

- Objects are copied MinIO → Garage by a private export/verify step
  (SHA-256 + metadata checked after copy); object *names* are identical, so
  no DB changes are needed.
- Cutover caveat: presigned URLs issued by MinIO are **invalid** against
  Garage — the `/minio/` alias only preserves the path shape, not old
  signatures. Issue fresh URLs after switching.
- Rollback: keep the old `minio` service definition / `home_minio_data`
  volume and the previous `MINIO_*` env values until the cutover is confirmed;
  redeploying the previous image tag restores MinIO-backed storage.

## Operations

- `docker exec garage /garage status` — node/layout health.
- `docker exec garage /garage bucket list` — buckets.
- Back up **both** `deploy_garage_data` and `deploy_garage_metadata`
  regularly — the data volume alone is not restorable without its metadata;
  there is no second node to heal from.
