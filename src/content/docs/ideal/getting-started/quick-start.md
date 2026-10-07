---
title: Quick start
description: Run IdeaL locally with Docker Compose, issue an API key, log in to the web UI, then create, find, archive an idea and report an outcome over the REST API.
sidebar:
  order: 2
---

IdeaL ships inside the `gigaevo-memory` repository (branch `dev`). The
supported way to run it is Docker Compose through the top-level `Makefile`.

:::caution[Use Compose, not start.sh]
`start.sh` and the `make local-*` targets are personal developer scripts. On
`dev` they do not produce a working stack: `start.sh` hard-codes another
machine's path, and the local targets use a Postgres image without `pgvector`,
look for `alembic.ini` in the wrong place and set a variable the API does not
read. Use `make up`.
:::

## 1. Start the stack

Requirements: Docker with Compose, GNU Make.

```bash
git clone -b dev https://github.com/Glazkoff/gigaevo-memory.git gigaevo-memory
cd gigaevo-memory
cp deploy/.env.example deploy/.env   # Compose refuses to start without it
make up
```

`make up` builds the images, runs `memory-migrate` (Alembic migrations, then
seeding) and starts five services: `nginx`, `memory-api`, `web-ui`,
`postgres` (pgvector) and `redis`.

| What | Address |
| --- | --- |
| Web UI | `http://localhost:8000/` |
| API | `http://localhost:8000/api/v1/...` |
| Swagger UI | `http://localhost:8000/api/docs` |
| Live OpenAPI schema | `http://localhost:8000/api/openapi.json` |
| Direct API port (loopback only, no `/api` prefix) | `http://127.0.0.1:8002` |

Check it:

```bash
curl -s http://localhost:8000/api/health
# {"status":"ok","postgres":"ok","redis":"ok",...,"auth":"open"}
```

With the example `.env`, `IDEAL_SEED_NAMESPACE=demo`, so the first start puts
40 seed ideas and one starting chain into namespace `demo`. The seeding is
idempotent: a rerun adds nothing that is already there.

`"auth":"open"` means `AUTH_REQUIRED=false`: requests without a key are served
as an anonymous caller. That is fine on a laptop. Do not expose such a stack.
See [Operations](/ideal/api/operations/).

## 2. Issue a key and log in

The web UI always asks for a personal API key, even when the API is open.

```bash
make create-key OWNER=alice LABEL="alice laptop"
# prints the key once; copy it now
```

The key can read and write namespace `alice` (its owner). To give it more
namespaces, or to issue admin keys, use the Admin tab or the admin API
(see [Namespaces and keys](/ideal/concepts/namespaces-and-keys/)).
An admin key for your own stack:

```bash
make create-key OWNER=admin SCOPES=admin:keys,read:any,write:any LABEL=admin
```

Open `http://localhost:8000/`, paste the key into **API-ключ** and press
**Войти**. The login form is in Russian on `dev`; the rest of the UI is in
English. Tabs: Chains, Agent Skills, Memory Cards, **IdeaL**, Search,
Showcase, Maintenance, and **Admin** for keys with `admin:keys`.

## 3. Create an idea

An idea is a memory card with `content.status = "active"`. Put `when_to_use`
in `meta` as well as in `content`: the retrieve response takes it from `meta`.

```bash
API=http://localhost:8000/api
KEY=<your key>

curl -s -X POST $API/v1/memory-cards \
  -H "X-API-Key: $KEY" -H 'Content-Type: application/json' -d '{
  "meta": {
    "name": "verify_total_against_line_items",
    "namespace": "alice",
    "tags": ["verification"],
    "when_to_use": "The answer is a sum or total reported in a table."
  },
  "content": {
    "name": "verify_total_against_line_items",
    "description": "Add a step after extraction that recomputes the total from the line items and flags a mismatch before answering.",
    "when_to_use": "The answer is a sum or total reported in a table.",
    "status": "active",
    "origin": "manual"
  }
}'
```

The response has `entity_id`, `version_id`, `version_number` (0 for the first
version) and an `etag`.

This endpoint does not check for duplicates. Maestro's idea form and the
seeding flows do that before writing. See [Ideas](/ideal/concepts/ideas/).

## 4. Find it

`mode=catalog` is the read that generation uses. It records nothing.

```bash
curl -s -X POST $API/v1/retrieve \
  -H "X-API-Key: $KEY" -H 'Content-Type: application/json' -d '{
  "mode": "catalog",
  "namespace": "alice",
  "context": {"task_description": "recompute the total from line items"},
  "k": 3
}'
```

Each item has `entity_type` (`memory_card`, `tool` or `chain`), `id`,
`relevance` and `content`. `relevance: null` means the item did not match the
query and was added as padding by name.

Try the same query in Russian: you get padding only, with `relevance: null`.
That is the English-only search limit.

## 5. Archive it

Archiving is a new version with `status: "archived"`. Archived ideas are never
returned by `retrieve`; their history stays. Pass the current `etag` in
`If-Match` so you do not overwrite someone else's edit (412 if it changed).

```bash
ID=<entity_id>
ETAG=$(curl -s -H "X-API-Key: $KEY" $API/v1/memory-cards/$ID | python3 -c 'import json,sys; print(json.load(sys.stdin)["etag"])')

curl -s -X PUT $API/v1/memory-cards/$ID \
  -H "X-API-Key: $KEY" -H "If-Match: $ETAG" -H 'Content-Type: application/json' -d '{
  "content": {
    "name": "verify_total_against_line_items",
    "description": "Add a step after extraction that recomputes the total from the line items and flags a mismatch before answering.",
    "when_to_use": "The answer is a sum or total reported in a table.",
    "status": "archived",
    "origin": "manual"
  },
  "change_summary": "archive"
}'
```

`PUT` replaces the whole `content`, so send every field, not only `status`.

## 6. Optional: a tiny evolution loop by hand

This is what an evolution service does for each mutation. Use a throwaway
namespace: these events stay in the lake's statistics.

```bash
# before the mutation: ask for a slate
curl -s -X POST $API/v1/retrieve -H "X-API-Key: $KEY" -H 'Content-Type: application/json' -d '{
  "mode": "evolution", "namespace": "alice", "task_key": "demo-task",
  "run_id": "demo-run-1", "candidate_id": "m1",
  "context": {"task_description": "Answer numeric questions over financial tables",
              "focus": "units and scale of numbers"},
  "k": 2
}'
# -> {"items": [...], "run_url": "http://.../v1/ideal/run/alice/demo-run-1?sig=...", ...}

# after the child is evaluated: report the outcome
curl -s -X POST $API/v1/outcome -H "X-API-Key: $KEY" -H 'Content-Type: application/json' -d '{
  "kind": "mutation", "run_id": "demo-run-1", "candidate_id": "m1",
  "delta": 0.04, "parent_score": 0.61,
  "cited_idea_ids": ["<id from the slate you really applied>"],
  "metric": {"name": "accuracy", "higher_is_better": true,
             "lower_bound": 0, "upper_bound": 1, "min_delta": 0.01}
}'
# -> 201 {"recorded": true, "created": true}; the same call again -> 200, created false
```

Open `run_url` in a browser to see the live run page with the radar. The
slate may be empty: that is the control arm, and it is normal.

## Stop

```bash
make stop    # stop, keep containers and data
make down    # remove containers; the Postgres volume stays
```

## Next

- [Ideas](/ideal/concepts/ideas/), [Rating and outcomes](/ideal/concepts/rating/)
- [Connect Maestro to IdeaL](/ideal/maestro/connect/)
- [API reference](/ideal/api/reference/)
