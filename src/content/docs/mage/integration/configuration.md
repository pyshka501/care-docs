---
title: Configuration
description: MAGEConfig — how to load it (code, TOML, MAGE_* environment variables, factories), the fields that matter most, the presets, and how Maestro's CARE_MAGE__* settings map onto it.
sidebar:
  order: 4
---

All settings live in one Pydantic model, `MAGEConfig`. Defaults below are
from the development line (`mmar_mage/schemas.py`); most also hold for 0.1.3.

## Loading

```python
from mmar_mage import MAGEConfig

MAGEConfig(mode="fast", api_key="sk-...", model="gpt-4o")
MAGEConfig.from_toml("configs/deep_local.toml")   # every field under [mage]
MAGEConfig.from_env()                             # MAGE_* variables, see below
MAGEConfig.for_openrouter(api_key="sk-or-...", model="anthropic/claude-3.5-sonnet")
MAGEConfig.for_local(base_url="http://localhost:8000/v1")   # api_key "EMPTY", model "__auto__"
```

## Main fields

| Field | Default | Notes |
| --- | --- | --- |
| `mode` | `deep` | `fast` or `deep`. |
| `generation_strategy` | `legacy` | 0.2: `semantic` routes `generate()` through `compile()`. |
| `provider` | `openai` | `openai`, `openrouter`, `local`, `custom`. |
| `base_url`, `api_key`, `model` | unset, unset, `gpt-4o` | `model="__auto__"` takes the first model the server lists at `/v1/models`. |
| `temperature` | `0.2` | |
| `max_retries` | `2` | Per model call. |
| `http_timeout`, `ssl_verify` | `60.0`, `true` | |
| `stage_llm_overrides` | `{}` | Per-stage model or temperature, keyed by stage name. |
| `allowed_step_types` | all MAGE types | Restrict what the chain may contain. |
| `enable_domain_analysis`, `enable_step_planning`, `enable_dag_optimization`, `enable_step_descriptions` | `true` | The four deep stages. |
| `enable_contract_compiler` | `true` | 0.2: deterministic single-tool chains. |
| `enable_memory`, `memory_base_url` | `true`, `http://localhost:8002` | Implicit save, see [Memory and reuse](/mage/concepts/memory/). |
| `enable_memory_research`, `memory_search_mode` | `false`, `hybrid` | Recall before planning. |
| `enable_web_research`, `web_search_provider`, `web_search_api_key` | `false`, `tavily`, unset | Providers: `tavily`, `serper`, `exa`, `serpapi`, `brave`, `duckduckgo` (no key, `web` extra). |
| `enable_suggested_naming_llm` | `true` | One extra call for a display name in deep mode. |
| `max_llm_calls`, `max_input_tokens`, `max_output_tokens`, `max_total_tokens`, `max_wall_time_seconds`, `max_cost_usd` | unset | 0.2: hard per-generation budgets. |

Every optional stage has its own `enable_*` switch, all off by default; the
list is in [Generation pipeline](/mage/concepts/pipeline/#deep-mode).

## Environment variables

`MAGEConfig.from_env()` reads only these variables. Booleans accept `true`,
`1`, `yes`. If `MAGE_API_KEY` is unset, `OPENAI_API_KEY` is used.

| Group | Variables |
| --- | --- |
| Endpoint | `MAGE_API_KEY`, `MAGE_BASE_URL`, `MAGE_MODEL`, `MAGE_PROVIDER`, `MAGE_SSL_VERIFY`, `MAGE_HTTP_TIMEOUT`, `MAGE_OPENROUTER_SITE_URL`, `MAGE_OPENROUTER_APP_NAME` |
| Strategy | `MAGE_GENERATION_STRATEGY` |
| Memory | `MAGE_ENABLE_MEMORY`, `MAGE_MEMORY_BASE_URL`, `MAGE_ENABLE_MEMORY_RESEARCH`, `MAGE_MEMORY_RELEVANCE_THRESHOLD`, `MAGE_MEMORY_RECALL_TOP_K`, `MAGE_MEMORY_SEARCH_MODE`, `MAGE_MEMORY_NAMESPACE`, `MAGE_MEMORY_APPLICABILITY_THRESHOLD`, `MAGE_MEMORY_MIN_APPLICABLE_HITS` |
| Web research | `MAGE_ENABLE_WEB_RESEARCH`, `MAGE_WEB_SEARCH_API_KEY`, `MAGE_WEB_SEARCH_PROVIDER`, `MAGE_WEB_MIN_SOURCED_CLAIMS`, `MAGE_WEB_EVIDENCE_RANKING_ENABLED`, `MAGE_WEB_CLAIM_ENTAILMENT_MODE` |
| Planning | `MAGE_ENABLE_NEEDS_ANALYSIS`, `MAGE_ENABLE_TOPOLOGY_SELECTION`, `MAGE_TOPOLOGY_MAX_CANDIDATES`, `MAGE_ENABLE_PARALLEL_TOPOLOGY_SAMPLING`, `MAGE_SIMPLICITY_BIAS`, `MAGE_SIMPLICITY_MAX_STEPS`, `MAGE_COLD_START_CANDIDATES`, `MAGE_ENABLE_TOOL_SYNTHESIS`, `MAGE_ENABLE_DEMO_BOOTSTRAP`, `MAGE_DEMO_BOOTSTRAP_CANDIDATES`, `MAGE_DEMO_BOOTSTRAP_TOP_K`, `MAGE_DEMO_BOOTSTRAP_MIN_PASS_RATE` |
| Quality and feedback | `MAGE_STEP_CRITIC_REVISION_THRESHOLD`, `MAGE_FEEDBACK_APPLICABILITY_THRESHOLD`, `MAGE_EXECUTION_FEEDBACK_THRESHOLD`, `MAGE_MAX_EXECUTION_FEEDBACK_ITERATIONS`, `MAGE_BENCHMARK_N_CASES`, `MAGE_MAX_DIGEST_CHARS` |
| Capabilities | `MAGE_ENABLE_OFFICIAL_MCP_REGISTRY_DISCOVERY`, `MAGE_OFFICIAL_MCP_REGISTRY_URL`, `MAGE_CAPABILITY_DISCOVERY_MAX_RESULTS`, `MAGE_ENABLE_CAPABILITY_METADATA_VERIFICATION`, `MAGE_ENABLE_CAPABILITY_RUNTIME_PROBE`, `MAGE_CAPABILITY_VERIFICATION_CACHE_PATH`, `MAGE_CAPABILITY_HEALTH_TTL_SECONDS` |
| Budgets | `MAGE_MAX_LLM_CALLS`, `MAGE_MAX_INPUT_TOKENS`, `MAGE_MAX_OUTPUT_TOKENS`, `MAGE_MAX_TOTAL_TOKENS`, `MAGE_MAX_WALL_TIME_SECONDS`, `MAGE_MAX_COST_USD` |

:::caution[No `MAGE_MODE`]
`mode` is not read from the environment. Set it in code or TOML. Checked:
`MAGE_MODE=fast` leaves `from_env().mode` at `deep`.
:::

The `mage` CLI does not call `from_env()` at all; it reads only
`MAGE_API_KEY`. See [CLI](/mage/integration/cli/).

## Presets

TOML files in `configs/` of the repository, loaded with `from_toml`:

| File | What it sets |
| --- | --- |
| `fast.toml` | Fast mode, no memory, no research. |
| `deep_local.toml` | Deep mode on a local Ollama-style server (`http://localhost:11434/v1`, model `__auto__`), memory and memory research on. |
| `deep_local_airi.toml` | The same against a hosted OpenAI-compatible inference server. |
| `deep_openrouter.toml` | Deep mode through OpenRouter. |
| `deep_research.toml` | Deep mode with memory and web research. |
| `care_default.toml` | Deep mode with streaming, schema-constrained output, replan generation, step critique on `tool` and `structured_output` steps, `step_describe_mode="auto"`. |
| `care_local.toml`, `care_research.toml` | Local-server and full-research variants of the above. |

## In Maestro

Maestro's `[mage]` section (`CARE_MAGE__<FIELD>`) is passed to `MAGEConfig`
field by field; a field the installed MAGE does not declare is an error.
Maestro then forces `provider="custom"` and its own Memory URL. In the
desktop app the endpoint, model and key come from the chat session, not from
`[mage]`. Maestro's defaults differ from MAGE's (for example memory research
on, `bm25` search, topology selection on): see
[Maestro configuration](/care/configuration/sections/) and
[Maestro as host](/mage/integration/maestro-host/).
