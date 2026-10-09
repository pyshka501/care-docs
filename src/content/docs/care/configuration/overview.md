---
title: Configuration
description: Where Maestro reads configuration — the desktop app settings, the four CareConfig layers, TOML and env mapping, and variables outside CareConfig.
sidebar:
  order: 1
---

## In the desktop app

Two sources matter:

1. **Settings → Chat model** (harness settings): provider, key and models.
   In the app this model does all of Maestro's model work: generation,
   execution, repair, data generation, workshop drafts, idea translation.
2. **Settings → MAESTRO**: memory, IdeaL, web research, evolution platform,
   app lock. It writes the `CareConfig` fields below and Keychain references.
   Every save needs a full restart. See [Settings](/care/app/settings/).

The `CARE_MAGE__*` provider, URL, model and key are **not** used by the
desktop app for generation; they configure the CLI, the TUI and the legacy
workbench. `CARE_MAGE__MODE` and the research switches do apply in the app.

## The four layers

`CareConfig` (in `care/config.py`) is read from four layers, in increasing
precedence:

1. defaults in `care.config.CareConfig`;
2. `~/.config/care/config.toml` (user-global);
3. `./care.toml` in the working directory (per project);
4. `CARE_*` environment variables (highest). At start, the CLI also loads
   `./.env`; variables already set in the shell win over it.

[`maestro init`](/care/cli/setup/) writes a starter `.env` for the CLI and the
TUI; [`maestro doctor`](/care/cli/setup/) shows which variables are set, the
resolved config path, installed extras and live probes of Memory, MAGE and the
platform.

## TOML and env mapping

Nested fields use a double underscore in env form:

```toml
[memory]
base_url = "http://localhost:8002"
retrieval_backend = "ideal"
ideal_namespace = "my-team"
```

is the same as:

```bash
CARE_MEMORY__BASE_URL=http://localhost:8002
CARE_MEMORY__RETRIEVAL_BACKEND=ideal
CARE_MEMORY__IDEAL_NAMESPACE=my-team
```

## Sections

`CareConfig` has twelve sections:

| Section | Env prefix | Purpose |
| --- | --- | --- |
| `mage` | `CARE_MAGE__*` | Chain generator: mode, research, limits, topology. Provider/URL/model/key for CLI, TUI, legacy workbench. |
| `memory` | `CARE_MEMORY__*` | GigaEvo Memory URL and key, read-only mode, chain memory backend, IdeaL namespace. |
| `platform` | `CARE_PLATFORM__*` | Evolution platform URLs and key, mutation and validation models. |
| `hub` | `CARE_HUB__*` | Agent hub for `/deploy` and `maestro deploy`. |
| `upload` | `CARE_UPLOAD__*` | External chain-upload target (`/upload`). |
| `sandbox` | `CARE_SANDBOX__*` | Skill sandbox: backend (`docker` default, `e2b`, `firejail`, `local`), limits, network policy. |
| `tools` | `CARE_TOOLS__*` | `@carl_tool` directory, bundled builtins, web search, code execution, tool synthesis, STARM solvers. |
| `telemetry` | `CARE_TELEMETRY__*` | Opt-in event sink (Langfuse). |
| `defaults` | `CARE_DEFAULTS__*` | Answer language, TUI language, DAG display, history size, reduced motion. |
| `chat` | `CARE_CHAT__*` | TUI modes and stage policies. |
| `context` | `CARE_CONTEXT__*` | `CARE.md` standing context and long-term memory. |
| `artifacts` | `CARE_ARTIFACTS__*` | Where files produced by chains are copied. |

Keys per section: [Section reference](/care/configuration/sections/). The
annotated list of variables is `.env.example` in the Maestro repository.

## Variables outside `CareConfig`

| Variable | Meaning |
| --- | --- |
| `CARE_BENCHMARK_FACTORY_DB` | SQLite file of the evolution data generator. Default `~/.local/state/care/benchmark-factory/factory.sqlite3`. |
| `MAESTRO_APP_LOCK_MODE` | Force the app lock for one launch: `disabled` or `touch-id`. |
| `CARE_LOG_FILE`, `CARE_LOG_LEVEL` | Write a log file; level (default `INFO`). |
| `CARE_CHAT__LOOP_MAX_ITER` | TUI Interactive loop cap (default 5). |
| `CARE_CHAT__GENERATION_MAX_ATTEMPTS` | TUI generation retries (default 3). |
| `CARE_CHAT__AD_HOC_HISTORY_TURNS`, `CARE_CHAT__AD_HOC_HISTORY_CHARS` | TUI follow-up context: turns (default 6) and characters per turn (default 1200). |

Developer-only variables for the desktop app select the harness runtime and
its data directory; see `maestro app --help`. The app sets further internal
`MAESTRO_HARNESS_*` variables for its tool process; do not set them by hand.

## Secrets

- In the desktop app, keys are entered in native dialogs and stored in the
  macOS Keychain. Config files hold only `keystore://` references.
- `maestro init` writes the generator key **in plain text** to `.env`.
- `maestro migrate-secrets` moves literal `*_api_key` values from
  `~/.config/care/config.toml` into the OS keystore and rewrites the file
  with `keystore://` references.
