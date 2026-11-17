---
title: API reference
description: The IdeaL HTTP API on gigaevo-memory dev. Authentication, ideas and tools CRUD, retrieve and outcome, run pages, seeding, admin keys and the MCP endpoint.
sidebar:
  order: 1
---

All paths below are relative to the API base: `http://localhost:8000/api`
behind the Compose nginx, or the direct API port without `/api`. The live
schema is at `{api}/openapi.json` and Swagger UI at `{api}/docs`.

:::note[openapi.yaml in the repository lags]
The committed `openapi.yaml` on `dev` predates the admin API, `/v1/auth/me`,
run links, run-page proposals and the LLM model endpoints. The running
server's `/openapi.json` is complete. This page follows the code.
:::

## Authentication

Send `X-API-Key: <key>`. OIDC bearer tokens (`Authorization: Bearer <jwt>`)
are accepted when `OIDC_ENABLED=true`; a bearer wins over a key.

| Situation | Result |
| --- | --- |
| No key, auth open (`AUTH_REQUIRED=false`, default) | Anonymous caller, no namespace limits. |
| No key, auth required | 401. |
| Invalid, revoked or expired key | 401, in both modes. |
| Namespace not allowed for the key | 403. |

Namespace rules are in [Namespaces and keys](/ideal/concepts/namespaces-and-keys/).

## Ideas (memory cards)

| Method and path | Does |
| --- | --- |
| `POST /v1/memory-cards` | Create an idea. Body: `{meta: {name, namespace, tags, when_to_use}, content: {...}}`. 201 with `entity_id`, `version_id`, `version_number`, `etag`. No duplicate check. |
| `GET /v1/memory-cards?namespace=&limit=&cursor=` | List, cursor-paginated (`limit` up to 200). Without `namespace`, a key sees its owner namespace unless it has `read:any`. |
| `GET /v1/memory-cards/{id}` | Current version. |
| `PUT /v1/memory-cards/{id}` | New version. Replaces the whole `content`. `If-Match: <etag>` gives 412 on a concurrent change. Optional `change_summary`. |
| `DELETE /v1/memory-cards/{id}` | Soft delete. Prefer `status: "archived"`. |
| `GET /v1/memory-cards/{id}/versions` | Version history. |
| `GET /v1/memory-cards/{id}/versions/{version_id}` | One version. |
| `GET /v1/memory_cards/duplicates?threshold=0.95&namespace=` | Near-duplicate pairs by embedding cosine similarity. 503 without vector search. |

Only `content.status == "active"` ideas are delivered by `retrieve`. See
[Ideas](/ideal/concepts/ideas/) for fields.

## Tools

Same shape at `/v1/tools` (`POST`, `GET` list, `GET`/`PUT`/`DELETE` by id).
`content` is validated: `tool_key`, `name`, `runtime` and `status` are
required; `description`, `input_schema`, `output_schema`,
`implementation_ref`, `implementation_hash`, `tags` and `origin` are optional.

## Retrieve

`POST /v1/retrieve`

| Field | Notes |
| --- | --- |
| `mode` | `evolution` or `catalog`. Required. |
| `namespace` | Required. |
| `run_id`, `candidate_id` | Required in `evolution`; together they identify one mutation decision. |
| `task_key` | Optional. In `catalog`: return this task's chains by fitness. In `evolution`: enables task-level experience; one run cannot change it (422). |
| `context.task_description` | Required. 1–2 sentences, English. Used for search when there is no focus. |
| `context.focus` | What to improve: a string or a list of up to 4 weak spots. The main search signal in `evolution`. |
| `context.extra` | Free-form; string values join the query. |
| `k` | Ideas to return; default `RETRIEVE_DEFAULT_K` (3). |
| `exclude_ids` | Never returned. In `catalog`, pass what you already have to get more. |

Response: `{"items": [...], "hints": [...], "run_url": ...}`. Each item has
`entity_type` (`memory_card`, `tool`, `chain`; skip unknown types), `id`,
`relevance` (`null` for padding and task chains) and `content`. Catalog items
also carry `efficacy`; evolution items do not. `run_url` is the signed live
page in `evolution`, `null` in `catalog`. `hints` in `catalog` may contain
`{"kind": "more", "remaining": N, "label": ...}`.

An empty `items` is a normal answer (control slate, or nothing relevant).
Repeating an `evolution` call with the same `run_id` + `candidate_id`
returns the recorded slate.

## Outcome

`POST /v1/outcome`, discriminated by `kind`.

**Mutation:**

| Field | Notes |
| --- | --- |
| `run_id`, `candidate_id` | The retrieve that delivered the slate. |
| `delta` | Child score minus parent score; `null` for an invalid child. |
| `parent_score` | Optional; enables range-relative strength. |
| `metric` | Optional `{name, higher_is_better=true, lower_bound, upper_bound, min_delta=0}`. |
| `cited_idea_ids` | Ideas from this slate that were really applied. |
| `change` | Optional `{diff, rationale}` for extraction. Truncated to 20000 / 4000 characters. |

Response `201 {"recorded": true, "created": true}`, or `200` with
`created: false` on an exact repeat. A mutation outcome takes its namespace
and task from the matching retrieve. Without a prior retrieve it is accepted
but has no scope and does not rate ideas.

**Run:**

| Field | Notes |
| --- | --- |
| `namespace`, `task_key`, `run_id` | Required. |
| `best_chain` | The final solution as JSON. Stored as a `chain` tagged `task:<task_key>`. |
| `best_fitness` | Its score. |
| `metric` | Optional, as above. |
| `path_idea_ids` | Ideas on the best chain's lineage. |

Response `201 {"chain_id": "..."}`, `200` on repeat.

## Run pages

| Method and path | Auth | Does |
| --- | --- | --- |
| `GET /v1/ideal/run/{ns}/{run}/link` | Key, read on `ns` | `{run_url, data_url}` of any run in the namespace. |
| `GET /v1/ideal/run/{ns}/{run}?sig=` | Signature | Live HTML page: radar, best score, arms, feed. Polls every 5 s. |
| `GET /v1/ideal/run/{ns}/{run}/data?sig=` | Signature | The page data as JSON: `run`, `curve`, `radar`, `radar_sectors`, `mutations`. |
| `POST`/`DELETE /v1/ideal/run/{ns}/{run}/force?sig=` | Signature | `{"idea_id": ...}`: force the idea into every next slate until cited, or stop. |
| `POST /v1/ideal/run/{ns}/{run}/propose?sig=` | Signature | `{"task_description": ...}`: draft candidate ideas with translations for display. 503 without a lake LLM. |
| `POST /v1/ideal/run/{ns}/{run}/ideas?sig=` | Signature | `{"ideas": [{name, description, when_to_use, tags}]}` (1–10): create and force them. Exact duplicates are returned, not created. |

Signature routes return 404 for a bad signature and 409 for a finished run
(for `propose` and `ideas`).

## Lake service endpoints

Used by the bundled web UI and by Maestro. Not a stable client contract.

| Method and path | Does |
| --- | --- |
| `GET /v1/ideal/overview?namespace=` | Totals (delivered vs control), tasks, ideas with `gain_rate`, `strength`, `efficacy`, runs with status `running`/`stalled`/`finished`. |
| `GET /v1/ideal/graph?namespace=&limit=` | Nodes and edges, see [the graph](/ideal/concepts/tools-and-graph/). |
| `GET /v1/ideal/runs/{run_id}/mutations` | One run's mutations in order. |
| `GET /v1/ideal/seed/status` | Whether the lake LLM is configured. |
| `POST /v1/ideal/seed/propose` | `{namespace, task_description, k=6}` (k ≤ 20): candidates with `keep`/`rewrite`/`drop` verdicts. Writes nothing. |
| `GET`/`PUT /v1/ideal/llm` | Available models and the chosen main and fast models; a stored choice overrides the environment. |

## Public guides

No key needed, even when auth is required:

| Path | Content |
| --- | --- |
| `GET /v1/ideal/AGENTS.md` | Harness-agnostic agent guide (Markdown). |
| `GET /v1/ideal/skill/SKILL.md`, `GET /v1/ideal/skill/scripts/lake.py` | The seeding skill. |

## Admin and identity

| Method and path | Scope | Does |
| --- | --- | --- |
| `GET /v1/auth/me` | Any real key | `{key_id, owner, namespaces, scopes}`. 401 for anonymous. |
| `POST /v1/admin/keys` | `admin:keys` | `{owner, label, namespaces, scopes, expires_days}` → key metadata and `plaintext`. |
| `GET /v1/admin/keys` | `admin:keys` | All keys with `last_used_at`, `request_count`, `viewable`, `namespace_activity`. |
| `GET /v1/admin/keys/{key_id}/plaintext` | `admin:keys` | `{plaintext}`; 404 if the key was issued without encrypted storage. |
| `PATCH /v1/admin/keys/{key_id}` | `admin:keys` | `{label, namespaces}`. |
| `POST /v1/admin/keys/{key_id}/revoke` | `admin:keys` | Revoke now. |
| `GET`/`PUT /v1/admin/settings` | `admin:keys` | `{auth_required}`; overrides `AUTH_REQUIRED`. |

## MCP

The API serves stateless Streamable HTTP MCP at `{api}/mcp`, with the same
`X-API-Key` and namespace rules.

```bash
claude mcp add --transport http ideal {api}/mcp --header "X-API-Key: <key>"
```

| Tool | Does |
| --- | --- |
| `ideal_namespaces` | Namespaces this key can read, with entity counts. |
| `ideal_catalog` | Compact chains, ideas and tools for a task. |
| `ideal_start_run` | A readable run id and its signed `run_url`. |
| `ideal_ideas` | Next candidate id (`m<N>`) and the evolution slate. |
| `ideal_report_change` | Parent and new scores (`null` for invalid), metric, applied idea ids from that slate, rationale, optional diff. |
| `ideal_report_run` | The complete best solution and its score. |

Resources: `ideal://AGENTS.md`, `ideal://skill/SKILL.md`,
`ideal://skill/scripts/lake.py`.

## Other memory endpoints

IdeaL shares the API with the rest of GigaEvo Memory: chains, steps, agents,
agent skills, versions and channels, unified search, SSE events,
`/health` and `/metrics`. Those are outside this section.
