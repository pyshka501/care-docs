---
title: Справочник разделов
description: Основные ключи каждого раздела CareConfig со значениями по умолчанию и какие из них использует приложение.
sidebar:
  order: 2
---

Каждый ключ — это и переменная окружения `CARE_<SECTION>__<KEY>`. Полный
аннотированный список — `.env.example` в репозитории Maestro. Значения по
умолчанию взяты из `care/config.py`.

## `mage`: генератор

| Ключ | По умолчанию | Замечания |
| --- | --- | --- |
| `mode` | `deep` | `fast` или `deep`. Действует и в приложении. |
| `api_key`, `base_url`, `model` | не задано | Endpoint генератора для CLI, TUI и старого workbench. **Приложение их не использует**, у него модель чата. |
| `enable_memory_research` | `true` | Перед планированием найти похожие сохранённые цепочки. |
| `memory_search_mode` | `bm25` | `bm25`, `vector` или `hybrid`. |
| `enable_web_research` | `false` | Разрешить генерации искать в вебе. |
| `web_search_provider`, `web_search_api_key` | `tavily`, не задано | `tavily`, `serper`, `exa`, `serpapi`, `brave`, `duckduckgo` (без ключа). |
| `enable_needs_analysis` | `false` | Дополнительный проход планирования: нужные инструменты, навыки и входы. |
| `max_llm_calls`, `max_input_tokens`, `max_output_tokens`, `max_total_tokens`, `max_wall_time_seconds`, `max_cost_usd` | не задано | Жёсткие лимиты на одну генерацию: она останавливается до превышения. |
| `enable_topology_selection` | `true` | Позволить планировщику выбирать нелинейную форму цепочки. |
| `simplicity_bias`, `simplicity_max_steps` | `0.2`, `7` | Управление длиной плана. |

## `memory`

| Ключ | По умолчанию | Замечания |
| --- | --- | --- |
| `base_url` | `http://localhost:8002` | API GigaEvo Memory. Для облачного хранилища укажите API-префикс. |
| `api_key` | не задано | Если сервер его требует. |
| `timeout` | `30` | Секунды. |
| `read_only` | `false` | Никогда не писать: нет сохранения цепочек, инструментов, навыков и идей; эволюция идёт без памяти IdeaL. |
| `retrieval_backend` | `legacy` | `legacy` или `ideal`. При `ideal` цепочки, выборка и идеи используют пространство IdeaL. |
| `ideal_namespace` | не задано | Обязательно при `retrieval_backend = "ideal"`. |

## `platform`: эволюция

| Ключ | По умолчанию | Замечания |
| --- | --- | --- |
| `base_url` | `http://localhost:8000` | Управляющий API платформы. |
| `master_base_url` | `http://localhost:8000` | Используется, если `base_url` указывает на runner на порту 8001. |
| `api_key` | не задано | |
| `mutation_base_url`, `mutation_model`, `mutation_api_key` | URL OpenRouter, бесплатная модель, не задано | Модель, которой платформа предлагает варианты цепочки. |
| `validation_base_url`, `validation_model`, `validation_api_key` | URL OpenRouter, бесплатная модель, не задано | Модель-судья. |
| `mutation_max_tokens`, `validation_max_tokens` | `8192`, `2048` | Лимиты на вызов, записываются в конфигурацию моделей платформы. |

Эти модели вызывает сама платформа, не Maestro.

## `sandbox`: навыки

| Ключ | По умолчанию | Замечания |
| --- | --- | --- |
| `kind` | `docker` | `docker` (нужны extra `docker` и работающий демон), `e2b` (облачная микро-VM; extra `e2b` и ключ), `firejail` (только Linux), `local` (подпроцесс, только для внутренних тестов; небезопасно). |
| `cpu_limit` | `2.0` | |
| `mem_limit` | `1g` | В стиле Docker: `512m`, `1g`, `2048k`. |
| `pids_limit` | `256` | |
| `network_policy` | `skill_declared` | `none`, `skill_declared` (домены, объявленные навыком), `open`. |
| `image` | `python:3.12-slim` | Образ контейнера. |

## `tools`

| Ключ | По умолчанию | Замечания |
| --- | --- | --- |
| `path` | `~/.config/care/tools` | Каталог файлов с `@carl_tool`. |
| `tag_filter`, `name_prefix` | не задано, пусто | Регистрировать только инструменты с тегами; префикс имён. |
| `enable_builtins` | `true` | `web_search`, `fetch_url`, `http_request`, `calculator`, `current_datetime` и `run_python`, если выполнение кода включено. |
| `web_search_provider`, `web_search_api_key`, `search_provider_keys` | `tavily`, не задано, `{}` | DuckDuckGo — запасной вариант без ключа. |
| `enable_code_exec` | `true` | `run_python` в песочнице Docker. |
| `code_exec_timeout` | `60` | Секунды на один вызов песочницы. |
| `auto_synthesize_tools` | `true` | Написать и зарегистрировать недостающий инструмент перед запуском (нужно выполнение кода). |
| `starm_host`, `starm_ports`, `starm_timeout` | `http://localhost`, `{}`, `120` | Серверы решателей STARM; инструмент решателя есть только для задачи с портом. См. [Решатели STARM](/ru/care/solvers/starm/). |

## `chat`: режимы TUI

| Ключ | По умолчанию | Замечания |
| --- | --- | --- |
| `default_mode` | `interactive` | `interactive` или `production`. `ad_hoc`, `ad-hoc`, `adhoc` → `interactive`; `prod` → `production`. |
| `mode.<mode>.<stage>` | не задано | Переопределение политики этапа, переменная `CARE_CHAT__MODE__<MODE>__<STAGE>` = `ask`, `auto` или `skip`. См. [режимы](/ru/care/workflows/modes/). |

## `defaults`

| Ключ | По умолчанию | Замечания |
| --- | --- | --- |
| `language` | `en` | Язык ответов цепочек (запуск в CLI/TUI). |
| `ui_language` | `ru` | Язык TUI. Приложение следует своей настройке языка. |
| `dag_layout` | `tb` | Модальное окно DAG в TUI: `tb` или `lr`. |
| `dag_ascii`, `dag_bus_lanes` | `false` | Варианты отрисовки DAG в TUI. |
| `max_history_entries` | `50` | |
| `reduced_motion` | `false` | Отключить анимации TUI. |

## `context`

| Ключ | По умолчанию | Замечания |
| --- | --- | --- |
| `enabled` | `true` | Читать постоянный контекст `CARE.md`. |
| `global_path`, `project_filename` | `~/.config/care/CARE.md`, `CARE.md` | Глобальный и проектный файлы. |
| `max_chars` | `8000` | Предел объединённого контекста. |
| `auto_learn_facts` | `false` | Записывать выученные факты в глобальный `CARE.md` (один лишний вызов модели за реплику). |
| `ltm_enabled`, `ltm_dir`, `ltm_autosave` | `true`, `~/.config/care/ltm`, `true` | Долговременная память CARL. |

## Остальное

| Раздел | Ключи |
| --- | --- |
| `hub` | `base_url` (`http://127.0.0.1:8080`), `port` (`8080`), `autostart` (`true`), `state_file` (`~/.care/agent-hub.json`), `agent_server_cmd`, `start_timeout`, `timeout`. См. [Развёртывание агентов](/ru/care/workflows/deploy/). |
| `upload` | `url` (пусто — `/upload` выключен), `api_key`, `auth_header` (`Authorization`), `timeout`. |
| `telemetry` | `enabled` (`false`), `backend` (`null` или `langfuse`), `host`, `public_key`, `secret_key`. |
| `artifacts` | `dir`: куда копируются файлы, созданные цепочками (по умолчанию `~/.care/artifacts`). |
