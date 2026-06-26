---
title: Section Reference
description: What each CareConfig section configures, with notable keys.
sidebar:
  order: 2
---

Notable keys per section. Every key is also a `CARE_<SECTION>__<KEY>` env var. The
[`.env.example`](https://github.com/Glazkoff/care/blob/main/.env.example) file in the
repo is the complete, annotated surface.

## `mage` — generator

The MAGE generator that turns a task into a chain. The minimum a fresh checkout
needs (written by [`care init`](/care/cli/setup/)).

| Key | Notes |
| --- | --- |
| `CARE_MAGE__API_KEY` | LLM API key. |
| `CARE_MAGE__BASE_URL` | OpenAI-compatible base URL (e.g. OpenRouter). |
| `CARE_MAGE__MODEL` | Model id (e.g. `qwen/qwen3-coder`). |
| `CARE_MAGE__MODE` | Generation mode. |

## `memory` & `platform`

| Key | Notes |
| --- | --- |
| `CARE_MEMORY__BASE_URL` | GigaEvo Memory URL — **required for Production mode**. |
| `CARE_MEMORY__API_KEY` | When the deployment enforces auth. |
| `CARE_PLATFORM__BASE_URL` | GigaEvo Platform URL (evolution runs). |

## `chat` — chat surface

| Key | Default | Notes |
| --- | --- | --- |
| `CARE_CHAT__DEFAULT_MODE` | `interactive` | Startup [mode](/care/getting-started/overview/) — `interactive` or `production`. Legacy `ad_hoc` / `ad-hoc` / `adhoc` (and `prod`) aliases normalise to the canonical id on read. |
| `CARE_CHAT__AD_HOC_HISTORY_TURNS` | `6` | Follow-up context window (turns). |
| `CARE_CHAT__AD_HOC_HISTORY_CHARS` | `1200` | Chars per remembered turn. |
| `CARE_CHAT__GENERATION_MAX_ATTEMPTS` | `3` | MAGE generation retries. |

### Per-stage mode overrides

Each mode runs four configurable pipeline stages — **run**, **save**, **baseline**,
**evolve** — and each defaults to a per-mode preset. Override any single stage with
the env pattern `CARE_CHAT__MODE__<MODE>__<STAGE>`, where `<MODE>` is `INTERACTIVE`
or `PRODUCTION` and `<STAGE>` is `RUN` / `SAVE` / `BASELINE` / `EVOLVE`. The value
sets that stage's policy:

| Value | Behaviour |
| --- | --- |
| `ask` | Gate the stage behind a confirmation prompt first. |
| `auto` | Run the stage silently. |
| `skip` | Never run the stage (and skip any stage that depends on it). |

```bash
# Auto-run in Interactive, but gate Save behind a confirmation in Production
CARE_CHAT__MODE__INTERACTIVE__RUN=auto
CARE_CHAT__MODE__PRODUCTION__SAVE=ask
```

An unset stage defers to the mode preset.

## The rest

| Section | What to set |
| --- | --- |
| `hub` | `CARE_HUB__*` — the [agent hub](/care/workflows/deploy/) for `/deploy` (`base_url`, `port`, `autostart`, `state_file`). |
| `upload` | `CARE_UPLOAD__URL` — endpoint for `/upload`. |
| `sandbox` | Backend (`local` / `docker` / `e2b` / `firejail`) + resource limits for AgentSkills. |
| `tools` | `@carl_tool` registry, bundled builtins (web_search…), on-the-fly synthesis. |
| `telemetry` | Opt-in event sink (e.g. Langfuse public/secret keys). |
| `defaults` | UI defaults — language, history size, [DAG display](#dag-display-defaults). |
| `context` | User-context injection (CARE.md + long-term-memory digest). |
| `artifacts` | Saved-artifact store directory. |

### DAG display defaults

How `[defaults]` draws chain DAGs across every surface (chat trail, inspect pane,
run overlay, DAG modal).

| Key | Default | Notes |
| --- | --- | --- |
| `CARE_DEFAULTS__DAG_LAYOUT` | `tb` | Initial DAG modal orientation — `tb` (top-down) or `lr` (left-to-right). Toggle live with `l`. |
| `CARE_DEFAULTS__DAG_ASCII` | `false` | Draw DAGs with plain ASCII glyphs instead of Unicode box-drawing — for terminals/fonts that can't render the box glyphs, or clean copy-paste. |
| `CARE_DEFAULTS__DAG_BUS_LANES` | `false` | Route multi-layer "skip" dependencies as left-margin channels instead of terse `◀ N` annotations on the dependent box. |

## Secrets

Keep API keys out of plaintext TOML with
[`care migrate-secrets`](/care/cli/setup/) — it moves them into the OS keychain.
