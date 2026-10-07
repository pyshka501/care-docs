---
title: Ideas
description: What an IdeaL idea is, its fields, active and archived status, versions, and how duplicates and similar ideas are caught.
sidebar:
  order: 1
---

An **idea** is one concrete change to a chain that a mutator can apply as
written and that a score can confirm or refute. In storage it is a GigaEvo
Memory `memory_card` in a namespace.

## A good idea

| Good | Not an idea |
| --- | --- |
| "Split numerical answering into two steps: first list every candidate number with label, unit and source line; then compute only from that list." | "Improve the prompt." |
| `when_to_use`: "The answer requires arithmetic over values found in the context." | `when_to_use`: "always" |
| One change, 1–3 sentences, names the step it touches. | Several unrelated changes in one card. |

Changing only a parameter (temperature, `k`, a threshold) is not an idea
either. Server-side extraction skips such changes on purpose.

## Fields

| Field | Where | Meaning |
| --- | --- | --- |
| `name` | `meta.name` and `content.name` | Short identifier, usually `snake_case` English. |
| `description` | `content.description` | What to change and how. The main text that search and mutators read. |
| `when_to_use` | `meta.when_to_use` and `content.when_to_use` | An observable condition. Evolution searches it first when it has a focus. Retrieve returns the `meta` value. |
| `status` | `content.status` | `active` or anything else. Only `active` is delivered. Maestro uses `archived`. |
| `tags` | `meta.tags` | Free tags. Maestro adds `topic:<topic>` and `origin:user`. |
| `origin` | `content.origin` | Who created it: `manual`, `user` (Maestro form), `skill`, `run_page`, extraction. |
| `source` | `content.source` | Paper, method name, "common practice", or a run for extracted ideas. |
| `topic`, `topic_label` | `content` | Maestro grouping: a Latin `topic` and a display label. |
| `content_hash` | `content` | Hash of the normalised description. Set by the seeder and run-page adds; derived on read when missing. |
| `variant_of` | `content` | Set on extracted ideas that are near-duplicates of an existing one. |
| `source_evidence` | `content` | Extracted ideas only: the run, candidate and outcome class they came from. |

## Status: active and archived

- **active**: returned by `retrieve` in both modes, counted on the overview.
- **archived**: never returned by `retrieve`. Its versions and its rating
  history stay. Maestro shows it on the graph with "В архиве".

There is no hard delete in Maestro. The REST API has `DELETE
/v1/memory-cards/{id}`, which is a soft delete: the card disappears from reads,
but its events stay in the lake's statistics. Prefer archiving.

For tools the rule is the other way round: a tool is delivered unless its
`status` is `archived`.

## Versions

Every edit is a new immutable version of the same idea (`PUT
/v1/memory-cards/{id}`). Version numbers start at 0.

- `GET /v1/memory-cards/{id}/versions` lists them with `change_summary` and
  `parents`.
- `PUT` replaces the whole `content`. Send every field.
- Send `If-Match: <etag>` to refuse a write when the idea changed since you
  read it (HTTP 412). Maestro always does this, so two people cannot silently
  overwrite each other.

Ratings belong to the idea id, not to a version. An edit keeps the
experience gathered so far.

## Duplicates and similar ideas

Duplicates dilute the lake: two copies split one idea's evidence. The checks
depend on who writes.

| Path | Exact duplicate | Similar idea |
| --- | --- | --- |
| `POST /v1/memory-cards` | Not checked. | Not checked. |
| Maestro idea form | Same normalised name in the namespace: refused. An archived twin: "restore it instead". | Word overlap of name, description and `when_to_use` (score ≥ 0.35), plus a catalog search hit with relevance ≥ 0.5. Saving needs an explicit "this is a different idea". |
| Web UI seeding and `POST /v1/ideal/seed/propose` | Same description hash. | The lake LLM gives each candidate a `keep`, `rewrite` or `drop` verdict and up to three nearby ideas. |
| Run page "add idea" | Same description hash: returned as a duplicate, not created. | Not checked. |
| Server-side extraction | Same description hash: skipped. | Near-duplicates are still written, as variants (`variant_of`, description ends with "Differs from …"). |
| `GET /v1/{entity_type}/duplicates` | Cosine similarity of stored embeddings (default ≥ 0.95). Needs `ENABLE_VECTOR_SEARCH=true`, otherwise 503. | Same. |

The Maestro check also reports `non_english` when less than 80% of the
letters are Latin. Such an idea is saved if you insist, but search will rarely
find it.

## Search

Ideas are found by BM25 full-text search over their search documents
(`name`, `description`, `when_to_use`). The text configuration is English.
Consequences:

- Russian (or other non-English) text is not stemmed or matched. A Russian
  query usually returns only padding (`relevance: null`).
- Matches weaker than `RETRIEVE_MIN_RELEVANCE` (0.20) count as not found.
- Paraphrases match only on shared words. Semantic search
  (`RETRIEVE_SEARCH_TYPE=semantic`) helps with paraphrases, but needs an
  image built with embeddings and vector search on. It is off by default.

See [Operations](/ideal/api/operations/) for the switches.
