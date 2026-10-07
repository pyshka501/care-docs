---
title: Section Reference
description: Notable keys of each CareConfig section with defaults, and which ones the desktop app uses.
sidebar:
  order: 2
---

Every key is also a `CARE_<SECTION>__<KEY>` environment variable. The full
annotated list is `.env.example` in the Maestro repository. Defaults below are
from `care/config.py`.

## `mage`: generator

| Key | Default | Notes |
| --- | --- | --- |
| `mode` | `deep` | `fast` or `deep`. Applies in the desktop app too. |
| `api_key`, `base_url`, `model` | unset | Generator endpoint for the CLI, TUI and legacy workbench. **Ignored by the desktop app**, which uses the chat model. |
| `enable_memory_research` | `true` | Recall related saved chains before planning. |
| `memory_search_mode` | `bm25` | `bm25`, `vector` or `hybrid`. |
| `enable_web_research` | `false` | Let generation search the web. |
| `web_search_provider`, `web_search_api_key` | `tavily`, unset | `tavily`, `serper`, `exa`, `serpapi`, `brave`, `duckduckgo` (no key). |
| `enable_needs_analysis` | `false` | Extra planning pass for required tools, skills and inputs. |
| `max_llm_calls`, `max_input_tokens`, `max_output_tokens`, `max_total_tokens`, `max_wall_time_seconds`, `max_cost_usd` | unset | Hard per-generation limits; generation fails before exceeding one. |
| `enable_topology_selection` | `true` | Let the planner choose non-linear chain shapes. |
| `simplicity_bias`, `simplicity_max_steps` | `0.2`, `7` | Plan length controls. |

## `memory`

| Key | Default | Notes |
| --- | --- | --- |
| `base_url` | `http://localhost:8002` | GigaEvo Memory API. For a hosted store include its API prefix. |
| `api_key` | unset | When the server needs one. |
| `timeout` | `30` | Seconds. |
| `read_only` | `false` | Never write: no saved chains, tools, skills or ideas; evolution runs without IdeaL memory. |
| `retrieval_backend` | `legacy` | `legacy` or `ideal`. With `ideal`, chains, recall and ideas use the IdeaL namespace. |
| `ideal_namespace` | unset | Required when `retrieval_backend = "ideal"`. |

## `platform`: evolution

| Key | Default | Notes |
| --- | --- | --- |
| `base_url` | `http://localhost:8000` | Platform control API. |
| `master_base_url` | `http://localhost:8000` | Used when `base_url` still points at a runner on port 8001. |
| `api_key` | unset | |
| `mutation_base_url`, `mutation_model`, `mutation_api_key` | OpenRouter URL, a free model, unset | The model the platform uses to propose chain variants. |
| `validation_base_url`, `validation_model`, `validation_api_key` | OpenRouter URL, a free model, unset | The judge model. |
| `mutation_max_tokens`, `validation_max_tokens` | `8192`, `2048` | Per-call caps written to the platform's model config. |

The platform calls these models itself; Maestro does not.

## `sandbox`: skills

| Key | Default | Notes |
| --- | --- | --- |
| `kind` | `docker` | `docker` (needs the `docker` extra and a running daemon), `e2b` (cloud microVM; `e2b` extra and key), `firejail` (Linux only), `local` (subprocess, for internal testing only; unsafe). |
| `cpu_limit` | `2.0` | |
| `mem_limit` | `1g` | Docker-style: `512m`, `1g`, `2048k`. |
| `pids_limit` | `256` | |
| `network_policy` | `skill_declared` | `none`, `skill_declared` (domains declared by the skill), `open`. |
| `image` | `python:3.12-slim` | Container image. |

## `tools`

| Key | Default | Notes |
| --- | --- | --- |
| `path` | `~/.config/care/tools` | Directory of `@carl_tool` files. |
| `tag_filter`, `name_prefix` | unset, empty | Register only tagged tools; prefix names. |
| `enable_builtins` | `true` | `web_search`, `fetch_url`, `http_request`, `calculator`, `current_datetime`, and `run_python` when code execution is on. |
| `web_search_provider`, `web_search_api_key`, `search_provider_keys` | `tavily`, unset, `{}` | DuckDuckGo is the keyless fallback. |
| `enable_code_exec` | `true` | `run_python` in the Docker sandbox. |
| `code_exec_timeout` | `60` | Seconds per sandbox call. |
| `auto_synthesize_tools` | `true` | Write and register a missing tool before a run (needs code execution). |
| `starm_host`, `starm_ports`, `starm_timeout` | `http://localhost`, `{}`, `120` | STARM solver servers; a solver tool exists only for a task with a port. See [STARM solvers](/care/solvers/starm/). |

## `chat`: TUI modes

| Key | Default | Notes |
| --- | --- | --- |
| `default_mode` | `interactive` | `interactive` or `production`. `ad_hoc`, `ad-hoc`, `adhoc` → `interactive`; `prod` → `production`. |
| `mode.<mode>.<stage>` | unset | Stage policy override, env `CARE_CHAT__MODE__<MODE>__<STAGE>` = `ask`, `auto` or `skip`. See [modes](/care/workflows/modes/). |

## `defaults`

| Key | Default | Notes |
| --- | --- | --- |
| `language` | `en` | Language chains answer in (CLI/TUI execution). |
| `ui_language` | `ru` | TUI language. The desktop app follows its own language setting. |
| `dag_layout` | `tb` | TUI DAG modal: `tb` or `lr`. |
| `dag_ascii`, `dag_bus_lanes` | `false` | TUI DAG drawing options. |
| `max_history_entries` | `50` | |
| `reduced_motion` | `false` | Disable TUI animations. |

## `context`

| Key | Default | Notes |
| --- | --- | --- |
| `enabled` | `true` | Read `CARE.md` standing context. |
| `global_path`, `project_filename` | `~/.config/care/CARE.md`, `CARE.md` | Global and per-project files. |
| `max_chars` | `8000` | Cap on merged context. |
| `auto_learn_facts` | `false` | Write learned facts into the global `CARE.md` (one extra model call per turn). |
| `ltm_enabled`, `ltm_dir`, `ltm_autosave` | `true`, `~/.config/care/ltm`, `true` | CARL long-term memory. |

## The rest

| Section | Keys |
| --- | --- |
| `hub` | `base_url` (`http://127.0.0.1:8080`), `port` (`8080`), `autostart` (`true`), `state_file` (`~/.care/agent-hub.json`), `agent_server_cmd`, `start_timeout`, `timeout`. See [Deploying agents](/care/workflows/deploy/). |
| `upload` | `url` (empty disables `/upload`), `api_key`, `auth_header` (`Authorization`), `timeout`. |
| `telemetry` | `enabled` (`false`), `backend` (`null` or `langfuse`), `host`, `public_key`, `secret_key`. |
| `artifacts` | `dir`: where files produced by chains are copied (default `~/.care/artifacts`). |
