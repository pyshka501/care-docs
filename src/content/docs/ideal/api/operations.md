---
title: Deployment and operations
description: Running IdeaL in production. Compose services, environment variables, search and LLM settings, migrations, backups, keys and security notes.
sidebar:
  order: 2
---

IdeaL runs as part of the GigaEvo Memory stack. Everything below is driven by
the top-level `Makefile` and `deploy/docker-compose.yml` (Compose project
`gigaevo-memory`) of the `gigaevo-memory` repository, branch `dev`.

## Services

| Service | Role | Exposed |
| --- | --- | --- |
| `nginx` | Single public entry. `/` → web UI, `/api/` → API (prefix stripped). | `${MEMORY_HTTP_BIND_ADDRESS:-0.0.0.0}:${MEMORY_HTTP_PORT:-8000}` |
| `memory-api` | FastAPI app (REST and `/mcp`). | Loopback `:8002` for debugging. |
| `web-ui` | Gradio UI. | Loopback `:7861` for debugging. |
| `memory-migrate` | One-shot: Alembic `upgrade head`, then seeding and the relations backfill. Runs before the API starts. | No. |
| `postgres` | `pgvector/pgvector:pg16`. | Internal only. |
| `redis` | Pub/sub for events, run counters. | Internal only. |

On a host without a firewall, set `MEMORY_HTTP_BIND_ADDRESS=127.0.0.1` and
put a TLS reverse proxy in front.

## Environment

Copy `deploy/.env.example` to `deploy/.env`. Compose refuses to start without
it.

### Core

| Variable | Default | Notes |
| --- | --- | --- |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | `memory`, `memory_dev_password`, `memory` | Change the password. |
| `POSTGRES_DSN` | matches the above | asyncpg DSN used by the API. |
| `REDIS_URL` | `redis://redis:6379/0` | |
| `API_SECRET_KEY` | `dev-secret-key-change-in-production` | **Change it.** Signs run-page links and encrypts admin-issued keys. Changing it later invalidates every run link and makes stored key plaintexts unreadable. |
| `API_ROOT_PATH` | `/api` | Public prefix; used to build `run_url`. |
| `AUTH_REQUIRED` | `false` | Set `true` in production. The Admin tab setting overrides it. |
| `CORS_ALLOWED_ORIGINS` | `*` | List explicit origins for browser clients. |
| `OIDC_ENABLED`, `OIDC_ISSUER`, `OIDC_AUDIENCE`, … | off | Optional bearer-token auth. |

### IdeaL

| Variable | Default | Effect |
| --- | --- | --- |
| `IDEAL_SEED_NAMESPACE` | `demo` in the example, empty in code | Namespace that receives 40 seed ideas and a starting chain. Empty: no seeding. |
| `IDEAL_PUBLIC_API_URL` | empty | External API URL put into the "Connect your agent" prompt; empty means browser origin + `/api`. |
| `IDEAL_UI_LANGUAGE` | `ru` | Run-page language (`ru` or `en`). `ru` translates page text through the lake LLM in the background; stored data stays English. |
| `IDEA_CONTROL_PROBABILITY` | `0.3` | Share of evolution slates left empty for comparison. |
| `IDEA_MIN_EVENTS` | `3` | Citations before `efficacy` is shown. |
| `IDEA_STRENGTH_PRIOR_COUNT` | `5` | Shrinks an idea's mean strength toward zero. |
| `IDEAL_TASK_TAG_PREFIX` | `task:` | Tag that binds chains to a task. Changing it hides existing task chains. |
| `IDEAL_EXTRACTION_ENABLED` | `false` | Extract new ideas from reported changes. Needs the lake LLM. |
| `IDEAL_EXTRACTION_MAX_DIFF_CHARS`, `…_MAX_RATIONALE_CHARS` | `20000`, `4000` | Stored limits for `change`. |

### Retrieval

| Variable | Default | Effect |
| --- | --- | --- |
| `RETRIEVE_DEFAULT_K` | `3` | Ideas when `k` is omitted. |
| `RETRIEVE_TOOL_LIMIT` | `1` | Relevant tools per retrieve. |
| `RETRIEVE_POOL_SIZE` | `10` | Candidates the evolution picker chooses from. |
| `RETRIEVE_RELEVANCE_WEIGHT` | `0.7` | Weight of query closeness vs usefulness (`0..1`). |
| `RETRIEVE_SEARCH_LIMIT` | `100` | Search depth. |
| `RETRIEVE_SEARCH_TYPE` | `bm25` | `bm25` or `semantic` (BM25 + vectors, merged by rank). |
| `RETRIEVE_MIN_RELEVANCE` | `0.20` | Weaker BM25 matches count as not found. |
| `RETRIEVE_MIN_SIMILARITY` | `0.434` | Weaker cosine matches count as not found (semantic). |
| `RETRIEVE_QUERY_MAX_TERMS` | `64` | Words taken from the context. |

Semantic retrieval needs all three: images built with `WITH_EMBEDDINGS=true`
(rebuild), `ENABLE_VECTOR_SEARCH=true`, and `RETRIEVE_SEARCH_TYPE=semantic`.
Embeddings: `EMBEDDING_PROVIDER` (`sentencetransformers`, `openai`,
`huggingface`), `EMBEDDING_MODEL` (default `all-MiniLM-L6-v2`),
`VECTOR_DIMENSION` (384). Semantic search helps with paraphrases. It does not
make Russian text searchable with the default English-only model.

### Lake LLM

Used by extraction, seeding proposals, semantic deduplication, run-page
translation and sector names.

| Variable | Example value | Notes |
| --- | --- | --- |
| `IDEAL_LLM_API_URL` | `https://inference.airi.net/v1` | Any OpenAI-compatible base URL. Unset in code. |
| `IDEAL_LLM_API_KEY` | — | Required for any LLM feature. |
| `IDEAL_LLM_MODEL` | `Qwen/Qwen3.8-27B` | Main model. |
| `IDEAL_LLM_FAST_MODEL` | — | Faster model for run-page proposals; falls back to the main one. |
| `IDEAL_LLM_DISABLE_THINKING` | `false` | Skip the reasoning phase on vLLM/Qwen3 to answer within timeouts. |

Without URL, key and model, LLM features are off: seeding proposals return
503, run pages show original text, sectors fall back to tags. Admins can
switch models in the web UI (IdeaL tab → LLM models); the stored choice
overrides the environment.

## Migrations

`make up` applies migrations automatically through `memory-migrate`. The
IdeaL tables come from migrations `006`–`017` (events, transfer metrics,
relations, extraction, run force, `when_to_use` search documents, UI
translation cache, settings, key namespaces, bootstrap admin, encrypted keys).

| Command | Does |
| --- | --- |
| `make migrate` | Run `memory-migrate` (upgrade head + seed + backfill). |
| `make migrate-down` | Downgrade one revision. |
| `make migrate-check` | Chain integrity tests, then upgrade → downgrade -1 → upgrade. Same check as CI. |
| `make db-reset` | Drop and recreate the schema (asks first). |

## Backups

```bash
make backup                                # ./backups/gigaevo-memory-<UTC>.sql.gz
S3_BUCKET=my-bucket make backup            # also upload to s3://my-bucket/gigaevo-memory/backups/
make backup-dry-run                        # print the commands only
```

Variables: `BACKUP_DIR`, `POSTGRES_USER`, `POSTGRES_DB`, `COMPOSE_FILE`,
`COMPOSE_PROJECT`, `S3_BUCKET`, `S3_PREFIX`. Schedule it with cron or a
systemd timer. Run events and ratings live in Postgres; Redis holds only
counters and pub/sub and does not need a backup.

## Keys

```bash
make create-key OWNER=alice [SCOPES=...] [LABEL="..."] [EXPIRES_DAYS=30]
```

The plaintext is printed once; the database stores a SHA-256 hash. Issue and
manage the rest in the Admin tab. See
[Namespaces and keys](/ideal/concepts/namespaces-and-keys/).

## Health and metrics

- `GET /health`: Postgres, Redis, pool stats, entity counts, `auth` mode.
- `GET /metrics`: Prometheus metrics (requests, latency, entity counts).

## Production checklist

- Set `AUTH_REQUIRED=true` (or the Admin switch) and a strong
  `API_SECRET_KEY` and Postgres password.
- Revoke the `bootstrap admin` key unless you hold its plaintext.
- Bind nginx to loopback and terminate TLS in front of it.
- Set `CORS_ALLOWED_ORIGINS` explicitly.
- Treat run links as secrets: they grant view and force access to a run.
- Schedule `make backup`.
- Remember that anyone who can write a namespace can steer mutations of runs
  that read it.
