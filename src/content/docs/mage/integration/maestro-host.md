---
title: Maestro as Host
description: How Maestro (package care) calls MAGE — which MAGE revision it pins, when it uses MAGE at all, what it passes in, which model MAGE talks to, and the checks Maestro runs on every chain it gets back.
sidebar:
  order: 3
---

Maestro (package `care`) is MAGE's reference host. It owns the conversation,
the model connection, memory and approvals; MAGE only turns a task into a
chain. Maestro never runs or saves a chain as a side effect of generating it.

## Which MAGE Maestro runs

Maestro does not install MAGE from PyPI. It pins git revisions of the
development line in `pyproject.toml` (`[tool.uv.sources]`):

| Maestro branch | MAGE revision | What it is |
| --- | --- | --- |
| `feat/maestro-library` (release 0.5.0 sources) | `6140b3b` (5 Oct 2026) | 0.2.0 line: typed requests, runtime admission, IdeaL hints selected by the host, task-title chain names. |
| `feat/dataset-studio` (development, after 0.5.0) | `b7a6e27` (2 Nov 2026), branch `maestro/step-field-refs` | The commit above plus fixes from `feat/v3-phase0`: saved input contracts survive edit and repair, typed literal bindings, `$steps.N.tool_name`, estimated usage when a provider reports none, and an export fix (a field of a step result is `$steps.N.result_data.<field>`, not `$history[N].<field>`). |

Both report version `0.2.0+ideal.20261005.1`. Both run `MAGEGenerator` with
the default `legacy` strategy. The v3 generator on `feat/v3-phase0` sits in
`evaluation/` and is **not used** by Maestro; the memory loop and the forges
on `feat/v3-ideal-loop` are not in either revision.

Maestro's dependency line still says `mmar-mage>=0.1.4`, a version that was
never published, so Maestro installs only from a checkout where the git pins
apply. It also overrides MAGE's own CARL pin with a CARL revision of its own.

## When Maestro calls MAGE

- **CLI and TUI:** `maestro generate` and the TUI generate screen always use
  MAGE, with the `[mage]` settings (`CARE_MAGE__*`): endpoint, model, key,
  mode, research switches. See [Generate, run and replay](/care/cli/generate-run/).
- **Desktop app, 0.5.0:** the Maestro harness picks a strategy for each chain
  request. A new chain is usually `generate_chain`, which runs MAGE through
  the `maestro_generate_chain` tool (or as a background job). `author_chain`,
  where the chat agent writes CARL itself, is used when you ask for it.
- **Desktop app, development branch:** the default flips. Setting
  `defaults.chain_author` (`CARE_DEFAULTS__CHAIN_AUTHOR`) is `agent`: the chat
  agent looks at real API responses, writes the chain, validates and
  test-runs it. With `mage`, or when you ask for MAGE, generation goes
  through MAGE as before. Not released.

## Which model MAGE talks to

MAGE builds its own OpenAI-compatible client from `MAGEConfig`. Maestro
always sets `provider="custom"` and fills `base_url`, `api_key`, `model`:

- **CLI and TUI:** from `[mage]`.
- **Desktop app:** from the chat session that asked for the chain, through the
  harness's private chat-model bridge. MAGE gets a loopback URL and a
  short-lived proxy credential; the provider key stays in the harness. If a
  chain operation has no chat binding, it fails instead of falling back to the
  `[mage]` key. The bridge raises MAGE's HTTP timeout to 300 s (capped by
  `max_wall_time_seconds`), because the proxy returns the whole response at
  once. On the development branch, `defaults.chain_model = "custom"` sends
  chain operations to the `[mage]` endpoint instead.

## What Maestro passes in

`care/generation.py` builds the `MAGEConfig` and a `GenerationRequest`:

| Input | How Maestro fills it |
| --- | --- |
| `MAGEConfig` | Every field of `[mage]` that the installed MAGE declares (an unknown field is an error, not silently dropped); `mode`; `provider="custom"`; `memory_base_url` = Maestro's Memory URL. |
| Memory switches | With IdeaL as chain memory: `enable_memory`, `enable_memory_research`, `enable_memory_skill_lookup` off, because Maestro recalls itself. |
| Deployable chains | `allowed_step_types` without `human_input`: a deployed agent has nobody to answer. |
| `current_task` | The safe task, without file bodies or private paths. |
| `project_instructions` | Standing user and project instructions. |
| Files | One `input_manifest` entry per file (name, kind, type, size, hash, profile) and the body as private `retrieved_untrusted_context`. |
| Turn context | Follow-up text richer than the task, with inline attachments stripped, as private untrusted context. |
| Recalled context | Maestro's recall of related chains, as untrusted context (`gigaevo-recall` or `ideal-catalog`). For IdeaL, the selected-context mode so the model sees only that item. |
| `runtime_input_schema` | The chain's input contract, when the plan has one. |
| Policies | `external_research="safe_task_only"`, `PersistencePolicy(mode="explicit_only")`: MAGE saves nothing. |
| `capabilities` | Maestro's tool catalogue as a closed-world `CapabilityContext`. |
| `cancel`, `progress` | Esc or the job's cancel button; progress drives the UI. |

See [Typed requests and admission](/mage/concepts/typed-authoring/) for what
each field means to MAGE.

## What Maestro checks on the way back

Maestro does not trust MAGE's own validation as the last word:

1. The chain is extracted from the result and the input schema is attached to
   its metadata.
2. A deterministic check of web-search tool queries, with one provider-free
   repair.
3. `validate_runtime_chain()` again, with the input schema, on the CARL that
   Maestro runs.
4. Only then is the chain staged as a private artifact pinned by SHA-256, with
   a structure card and a readiness summary. Saving, running, deploying and
   evolving are separate actions with their own receipts and approvals.

Failures reach the chat as typed codes (`provider_failed`,
`generation_validation_failed`, `invalid_generation_result`,
`chain_admission_failed`) with a diagnostic, never as raw provider output.

## See also

- [Maestro architecture](/care/concepts/architecture/)
- [Maestro configuration: `mage` section](/care/configuration/sections/)
- [CARL in Maestro](/carl/care-integration/overview/)
- [Connect Maestro to IdeaL](/ideal/maestro/connect/)
