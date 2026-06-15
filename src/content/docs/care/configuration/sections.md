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
| `CARE_CHAT__DEFAULT_MODE` | `ad_hoc` | Startup [mode](/care/getting-started/overview/). |
| `CARE_CHAT__AD_HOC_HISTORY_TURNS` | `6` | Follow-up context window (turns). |
| `CARE_CHAT__AD_HOC_HISTORY_CHARS` | `1200` | Chars per remembered turn. |
| `CARE_CHAT__GENERATION_MAX_ATTEMPTS` | `3` | MAGE generation retries. |

## The rest

| Section | What to set |
| --- | --- |
| `hub` | `CARE_HUB__*` — the [agent hub](/care/workflows/deploy/) for `/deploy` (`base_url`, `port`, `autostart`, `state_file`). |
| `upload` | `CARE_UPLOAD__URL` — endpoint for `/upload`. |
| `sandbox` | Backend (`local` / `docker` / `e2b` / `firejail`) + resource limits for AgentSkills. |
| `tools` | `@carl_tool` registry, bundled builtins (web_search…), on-the-fly synthesis. |
| `telemetry` | Opt-in event sink (e.g. Langfuse public/secret keys). |
| `defaults` | UI defaults — language, history size. |
| `context` | User-context injection (CARE.md + long-term-memory digest). |
| `artifacts` | Saved-artifact store directory. |

## Secrets

Keep API keys out of plaintext TOML with
[`care migrate-secrets`](/care/cli/setup/) — it moves them into the OS keychain.
