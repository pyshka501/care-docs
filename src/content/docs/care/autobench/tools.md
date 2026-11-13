---
title: Agent tools
description: Reference for the autobench tools the Maestro agent can call — maestro_benchmark_* and the related dataset tools — with their arguments, what costs model calls, which ones ask for confirmation, and where runs are stored.
sidebar:
  order: 7
---

The Maestro agent drives autobench through MCP tools named
`maestro_benchmark_*` (published to the Maestro harness as
`mcp__maestro__maestro_benchmark_*`). The **Datasets** screen calls the same
tools. Every result has `status` (`completed`, `unavailable` or `rejected`),
an optional `message` and `data`.

## Confirmations

| Tool | Model calls | Agent call | Call from the Datasets screen |
| --- | --- | --- | --- |
| `maestro_benchmark_start` | yes, within the budget | **asks** | no dialog (the wizard button is consent) |
| `maestro_benchmark_control`: `pause`, `resume`, `stop`, `retry_failed` | resume continues paid work within the approved budget | no dialog | no dialog |
| `maestro_benchmark_control`: `extend` | yes, more paid calls; may raise the budget | **asks** | no dialog |
| `maestro_benchmark_instruct` | one spec call when applied | no dialog | no dialog |
| `maestro_benchmark_program` | only `revise` (one call) | **asks**, for every operation | no dialog |
| `maestro_benchmark_edit`, `maestro_benchmark_compose` | none | no dialog | no dialog |
| `maestro_benchmark_status`, `_list`, `_models`, `_file`, `_dataset` | none (read-only) | no dialog | no dialog |
| `maestro_dataset_import` | none | no dialog | — |

A session with the **never ask** approval preset approves the dialogs above
automatically. Only calls minted by the app's own screen skip the dialog; the
agent cannot borrow that path. See [Confirmations](/care/app/confirmations/).

## Tools

### `maestro_benchmark_start`

Start generating a verified dataset for a task or chain. Returns at once; work
continues in the background.

| Argument | Meaning |
| --- | --- |
| `idempotency_key` | 8–128 characters. Repeating a start with the same key returns the same run. |
| `task` | The task, up to 8,000 characters. Required. |
| `chain` | `{artifact_id, content_sha256}` of a chain staged in this session. |
| `chain_entity_id` | A chain saved in memory; used when the staged artifact is gone. |
| `chain_name`, `input_fields`, `output_description`, `tools` | Optional context. Input fields default to the chain's `input.<name>` references, else `text`. |
| `settings` | Optional; see below. |

`settings` (all optional):

| Field | Values | Default |
| --- | --- | --- |
| `target_cases` | 4–500 | 24 |
| `difficulty` | `easier`, `balanced`, `harder` | `balanced` |
| `holdout_fraction` | 0–0.5 | 0.25 |
| `max_total_tokens` | 5,000–5,000,000 | 1,000,000 with Codex, 200,000 with the chat model |
| `stop_mode` | `target`, `budget`, `calls` | `target` |
| `max_llm_calls` | 1–5000 | required for `calls` |
| `provider` | `codex`, `chat` | Codex if available |
| `model` | model name | Codex default model, or the chat model |
| `reasoning_effort` | `low`, `medium`, `high` | — |
| `batch_size` | 1–25 | 10 |
| `task_kind` | `text`, `tools` | `text` |
| `strategy` | `llm`, `program` | `llm` |
| `modality` | `text`, `image`, `pdf`, `docx`, `xlsx`, `csv`, `audio` | `text` |
| `check_method` | `auto`, `exact`, `one_of`, `numeric`, `regex`, `json_fields`, `contains_all`, `judge` | `auto` |
| `check_description` | up to 4,000 characters | — |
| `check_pattern`, `check_fields` (one field), `check_tolerance`, `check_labels` | parameters of the check | — |
| `input_format`, `output_format`, `requirements` | free text | — |

Refused: file modalities without Codex, files with `tools`, `program` with
`tools` or files, `calls` without `max_llm_calls`.

### `maestro_benchmark_status`

Read a run: stage, counters, events after `after_seq`, spec versions,
instructions, units, dataset versions and, with `include_cases` (default
true), the last 1,000 cases. Holdout references, rationales and the solver's
answers on holdout cases are never returned.

### `maestro_benchmark_list`

List runs (`limit` 1–100, default 20).

### `maestro_benchmark_control`

`action`: `pause`, `resume`, `stop`, `retry_failed` (optionally one
`unit_id`) or `extend`. Each call needs a `request_key`; repeating it replays
the first result. For `extend`: `counts` is `{family_id: how many more}` (up to
200 per family), `extra_tokens` raises the budget (total at most 5,000,000).

### `maestro_benchmark_instruct`

Add an instruction (up to 2,000 characters) to a running or paused run. It is
applied at the next safe point and creates a new spec version. Needs a
`request_key`.

### `maestro_benchmark_edit`

Edit cases without model calls. `op`: `update`, `accept`, `exclude`,
`restore`, `move`, `add`; with `case_id`, `fields`, `expected`,
`alternatives`, `split`, `family_id` as needed. Edited and added cases are
accepted at level `manual`.

### `maestro_benchmark_compose`

Plan a version from accepted cases: `total`, `shares` (`{family_id: weight}`),
`splits` (`{family_id: "search" | "holdout"}`). With `save: true` it stores a
new version; otherwise it returns the plan only.

### `maestro_benchmark_program`

Generator programs. `op`: `show`, `preview` (run `code` or the saved program on
`count` cases in the sandbox), `save` (store `code` as a new version),
`revise` (one model call with `instruction`), `generate` (`count` more cases,
up to 2,000, locally). `revise` and `generate` are refused while the run is
still working.

### `maestro_benchmark_file`

Read the generated file of a **search** case for review: name, size, MIME
type, path and, up to about 1.4 MB, the content in base64. Holdout files are
refused.

### `maestro_benchmark_models`

Which providers are available: Codex status, its reason when unavailable, its
models and default model; the chat model; the default provider.

### `maestro_benchmark_dataset`

Stage the search part of a version (`dataset_id`, `bf_<16 hex>.v<N>`) as an
evolution dataset artifact and return the evaluator settings: `binary_match`
with `equality` or `regexp`, or a rubric with `LLM judge (0..1)`. Refused for
tool tasks, file inputs, unsupported checks and versions with fewer than 2
search cases.

### Related tools

- `maestro_find_artifacts`: find chains and dataset versions by words
  (*"the latest dataset"*); returns `dataset:<id>` references.
- `maestro_evolution_prepare`: stage a chain and a dataset from those
  references.
- `maestro_dataset_import`: import a CSV/TSV/XLSX file from the project folder
  as an evolution dataset. See
  [Import your own file](/care/autobench/evolution/#import-your-own-file).

## Storage

Runs, cases, specs, programs and dataset versions are kept in a local SQLite
file:

```bash
# default
~/.local/state/care/benchmark-factory/factory.sqlite3
# generated input files
~/.local/state/care/benchmark-factory/assets/<run_id>/
# override the store path
export CARE_BENCHMARK_FACTORY_DB=/path/to/factory.sqlite3
```

The model credential of a run lives only in process memory and is never
written to the store.
