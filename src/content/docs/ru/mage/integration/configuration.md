---
title: "Настройки"
description: "MAGEConfig: как загрузить (код, TOML, переменные MAGE_*, фабрики), главные поля, пресеты и как на него ложатся настройки CARE_MAGE__* в Maestro."
sidebar:
  order: 4
---

Все настройки живут в одной модели Pydantic, `MAGEConfig`. Значения по
умолчанию ниже взяты из ветки разработки (`mmar_mage/schemas.py`); большая
часть верна и для 0.1.3.

## Загрузка

```python
from mmar_mage import MAGEConfig

MAGEConfig(mode="fast", api_key="sk-...", model="gpt-4o")
MAGEConfig.from_toml("configs/deep_local.toml")   # все поля в секции [mage]
MAGEConfig.from_env()                             # переменные MAGE_*, см. ниже
MAGEConfig.for_openrouter(api_key="sk-or-...", model="anthropic/claude-3.5-sonnet")
MAGEConfig.for_local(base_url="http://localhost:8000/v1")   # api_key "EMPTY", модель "__auto__"
```

## Главные поля

| Поле | По умолчанию | Заметки |
| --- | --- | --- |
| `mode` | `deep` | `fast` или `deep`. |
| `generation_strategy` | `legacy` | 0.2: `semantic` пускает `generate()` через `compile()`; кандидат 0.2.0: `v3` запускает [генератор v3](/ru/mage/concepts/v3-generator/), см. [ниже](#стратегия-v3). |
| `provider` | `openai` | `openai`, `openrouter`, `local`, `custom`. |
| `base_url`, `api_key`, `model` | не задан, не задан, `gpt-4o` | `model="__auto__"` берёт первую модель из списка сервера `/v1/models`. |
| `temperature` | `0.2` | |
| `max_retries` | `2` | На один вызов модели. |
| `http_timeout`, `ssl_verify` | `60.0`, `true` | |
| `stage_llm_overrides` | `{}` | Модель или температура для отдельной стадии, ключ это имя стадии. |
| `allowed_step_types` | все типы MAGE | Ограничить, что может быть в цепочке. |
| `enable_domain_analysis`, `enable_step_planning`, `enable_dag_optimization`, `enable_step_descriptions` | `true` | Четыре стадии deep. |
| `enable_contract_compiler` | `true` | 0.2: детерминированные цепочки из одного инструмента. |
| `enable_memory`, `memory_base_url` | `true`, `http://localhost:8002` | Неявное сохранение, см. [Память и переиспользование](/ru/mage/concepts/memory/). |
| `enable_memory_research`, `memory_search_mode` | `false`, `hybrid` | Поиск до планирования. |
| `enable_web_research`, `web_search_provider`, `web_search_api_key` | `false`, `tavily`, не задан | Провайдеры: `tavily`, `serper`, `exa`, `serpapi`, `brave`, `duckduckgo` (без ключа, extra `web`). |
| `enable_suggested_naming_llm` | `true` | Ещё один вызов ради имени в deep. |
| `max_llm_calls`, `max_input_tokens`, `max_output_tokens`, `max_total_tokens`, `max_wall_time_seconds`, `max_cost_usd` | не заданы | 0.2: жёсткие бюджеты на одну генерацию. |

У каждой необязательной стадии свой переключатель `enable_*`, все по
умолчанию выключены; список в [Конвейере генерации](/ru/mage/concepts/pipeline/).

## Стратегия v3

**Кандидат 0.2.0.** Эти поля читаются только при
`generation_strategy="v3"`. Значения по умолчанию взяты из измеренной
конфигурации v3.4.

| Поле | По умолчанию | Заметки |
| --- | --- | --- |
| `v3_max_repairs` | `3` | Раунды починки по замечаниям допуска после первой попытки автора (от 0 до 10). |
| `v3_dry_run_rounds` | `1` | Раунды сухого прогона (от 0 до 3); `0` выключает прогон. |
| `v3_dry_run_fixtures` | `2` | Синтетических тестовых входов на раунд (от 1 до 4). |
| `v3_dry_run_repairs` | `2` | Попыток автора на починку одного проваленного прогона (от 1 до 3). |
| `v3_dry_run_timeout_seconds` | `240.0` | Предел по времени на прогон одного тестового входа в CARL. |
| `v3_dry_run_judge` | `false` | Проверка каждого ответа сухого прогона моделью в свежем контексте. В v3.4 выключена, работает только детерминированная проверка. |
| `v3_dry_run_max_output_tokens` | `6144` | Потолок на вызов для собственных шагов модели в цепочке во время прогона; `None` значит без дополнительного потолка. |
| `v3_temperature` | `0.0` | Температура каждого вызова v3; `None` берёт `temperature`. |
| `v3_normalize_bindings` | `false` | Переписывать типизированные и голые аргументы инструментов как строковые привязки CARL. В v3.4 выключено. |

Сухой прогон никогда не вызывает инструменты хоста, но тратит вызовы модели:
тестовые входы, собственные шаги модели в цепочке и имитацию инструментов.
Бюджеты `max_*` их учитывают. Переменных окружения у полей `v3_*` нет.

## Переменные окружения

`MAGEConfig.from_env()` читает только эти переменные. Булевы значения:
`true`, `1`, `yes`. Если `MAGE_API_KEY` не задан, берётся `OPENAI_API_KEY`.

| Группа | Переменные |
| --- | --- |
| Эндпоинт | `MAGE_API_KEY`, `MAGE_BASE_URL`, `MAGE_MODEL`, `MAGE_PROVIDER`, `MAGE_SSL_VERIFY`, `MAGE_HTTP_TIMEOUT`, `MAGE_OPENROUTER_SITE_URL`, `MAGE_OPENROUTER_APP_NAME` |
| Стратегия | `MAGE_GENERATION_STRATEGY` |
| Память | `MAGE_ENABLE_MEMORY`, `MAGE_MEMORY_BASE_URL`, `MAGE_ENABLE_MEMORY_RESEARCH`, `MAGE_MEMORY_RELEVANCE_THRESHOLD`, `MAGE_MEMORY_RECALL_TOP_K`, `MAGE_MEMORY_SEARCH_MODE`, `MAGE_MEMORY_NAMESPACE`, `MAGE_MEMORY_APPLICABILITY_THRESHOLD`, `MAGE_MEMORY_MIN_APPLICABLE_HITS` |
| Поиск по вебу | `MAGE_ENABLE_WEB_RESEARCH`, `MAGE_WEB_SEARCH_API_KEY`, `MAGE_WEB_SEARCH_PROVIDER`, `MAGE_WEB_MIN_SOURCED_CLAIMS`, `MAGE_WEB_EVIDENCE_RANKING_ENABLED`, `MAGE_WEB_CLAIM_ENTAILMENT_MODE` |
| Планирование | `MAGE_ENABLE_NEEDS_ANALYSIS`, `MAGE_ENABLE_TOPOLOGY_SELECTION`, `MAGE_TOPOLOGY_MAX_CANDIDATES`, `MAGE_ENABLE_PARALLEL_TOPOLOGY_SAMPLING`, `MAGE_SIMPLICITY_BIAS`, `MAGE_SIMPLICITY_MAX_STEPS`, `MAGE_COLD_START_CANDIDATES`, `MAGE_ENABLE_TOOL_SYNTHESIS`, `MAGE_ENABLE_DEMO_BOOTSTRAP`, `MAGE_DEMO_BOOTSTRAP_CANDIDATES`, `MAGE_DEMO_BOOTSTRAP_TOP_K`, `MAGE_DEMO_BOOTSTRAP_MIN_PASS_RATE` |
| Качество и обратная связь | `MAGE_STEP_CRITIC_REVISION_THRESHOLD`, `MAGE_FEEDBACK_APPLICABILITY_THRESHOLD`, `MAGE_EXECUTION_FEEDBACK_THRESHOLD`, `MAGE_MAX_EXECUTION_FEEDBACK_ITERATIONS`, `MAGE_BENCHMARK_N_CASES`, `MAGE_MAX_DIGEST_CHARS` |
| Возможности | `MAGE_ENABLE_OFFICIAL_MCP_REGISTRY_DISCOVERY`, `MAGE_OFFICIAL_MCP_REGISTRY_URL`, `MAGE_CAPABILITY_DISCOVERY_MAX_RESULTS`, `MAGE_ENABLE_CAPABILITY_METADATA_VERIFICATION`, `MAGE_ENABLE_CAPABILITY_RUNTIME_PROBE`, `MAGE_CAPABILITY_VERIFICATION_CACHE_PATH`, `MAGE_CAPABILITY_HEALTH_TTL_SECONDS` |
| Бюджеты | `MAGE_MAX_LLM_CALLS`, `MAGE_MAX_INPUT_TOKENS`, `MAGE_MAX_OUTPUT_TOKENS`, `MAGE_MAX_TOTAL_TOKENS`, `MAGE_MAX_WALL_TIME_SECONDS`, `MAGE_MAX_COST_USD` |

:::caution[Переменной `MAGE_MODE` нет]
`mode` из окружения не читается. Задайте его в коде или в TOML. Проверено:
при `MAGE_MODE=fast` `from_env().mode` остаётся `deep`.
:::

CLI `mage` вообще не вызывает `from_env()` и читает только `MAGE_API_KEY`.
См. [CLI](/ru/mage/integration/cli/).

## Пресеты

TOML-файлы в каталоге `configs/` репозитория, загружаются через
`from_toml`:

| Файл | Что задаёт |
| --- | --- |
| `fast.toml` | Режим fast, без памяти и поиска. |
| `deep_local.toml` | Deep на локальном сервере в стиле Ollama (`http://localhost:11434/v1`, модель `__auto__`), память и поиск по памяти включены. |
| `deep_local_airi.toml` | То же на удалённом OpenAI-совместимом сервере инференса. |
| `deep_openrouter.toml` | Deep через OpenRouter. |
| `deep_research.toml` | Deep с поиском по памяти и вебу. |
| `care_default.toml` | Deep со стримингом, ответами по схеме, генерацией перепланирования, критикой шагов `tool` и `structured_output`, `step_describe_mode="auto"`. |
| `care_local.toml`, `care_research.toml` | Варианты того же для локального сервера и для полного поиска. |

## В Maestro

Секция `[mage]` Maestro (`CARE_MAGE__<FIELD>`) передаётся в `MAGEConfig`
поле в поле; поле, которого установленный MAGE не объявляет, даёт ошибку.
Затем Maestro ставит `provider="custom"` и свой адрес памяти. В приложении
эндпоинт, модель и ключ берутся из чат-сессии, а не из `[mage]`. Значения по
умолчанию в Maestro отличаются от MAGE (например, поиск по памяти включён,
поиск `bm25`, выбор топологии включён): см.
[Настройки Maestro](/ru/care/configuration/sections/) и
[Maestro как хост](/ru/mage/integration/maestro-host/).
