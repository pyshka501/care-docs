---
title: Справочник секций
description: Что настраивает каждая секция CareConfig с ключевыми параметрами.
sidebar:
  order: 2
---

Ключевые параметры по каждой секции. Каждый ключ также является env-переменной
`CARE_<СЕКЦИЯ>__<КЛЮЧ>`. Файл
[`.env.example`](https://github.com/Glazkoff/care/blob/main/.env.example) в репозитории —
полная аннотированная поверхность.

## `mage` — генератор

Генератор MAGE, превращающий задачу в цепочку. Минимум, необходимый новому
чекауту (записывается [`care init`](/ru/care/cli/setup/)).

| Ключ | Описание |
| --- | --- |
| `CARE_MAGE__API_KEY` | API-ключ LLM. |
| `CARE_MAGE__BASE_URL` | Базовый URL, совместимый с OpenAI (например, OpenRouter). |
| `CARE_MAGE__MODEL` | Идентификатор модели (например, `qwen/qwen3-coder`). |
| `CARE_MAGE__MODE` | Режим генерации. |

## `memory` и `platform`

| Ключ | Описание |
| --- | --- |
| `CARE_MEMORY__BASE_URL` | URL GigaEvo Memory — **обязателен для режима Production**. |
| `CARE_MEMORY__API_KEY` | Если деплой требует авторизации. |
| `CARE_PLATFORM__BASE_URL` | URL GigaEvo Platform (запуски эволюции). |

## `chat` — чат-поверхность

| Ключ | По умолчанию | Описание |
| --- | --- | --- |
| `CARE_CHAT__DEFAULT_MODE` | `ad_hoc` | [Режим](/ru/care/getting-started/overview/) при запуске. |
| `CARE_CHAT__AD_HOC_HISTORY_TURNS` | `6` | Окно контекста для уточняющих вопросов (ходов). |
| `CARE_CHAT__AD_HOC_HISTORY_CHARS` | `1200` | Символов на запомненный ход. |
| `CARE_CHAT__GENERATION_MAX_ATTEMPTS` | `3` | Повторных попыток генерации MAGE. |

## Остальное

| Секция | Что настраивать |
| --- | --- |
| `upload` | `CARE_UPLOAD__URL` — эндпоинт для `/upload`. |
| `sandbox` | Бэкенд (`local` / `docker` / `e2b` / `firejail`) + лимиты ресурсов для AgentSkills. |
| `tools` | Реестр `@carl_tool`, встроенные инструменты (web_search…), синтез на лету. |
| `telemetry` | Opt-in стрим событий (например, публичный/секретный ключи Langfuse). |
| `defaults` | Значения UI по умолчанию — язык, размер истории. |
| `context` | Инжекция пользовательского контекста (CARE.md + дайджест долгосрочной памяти). |
| `artifacts` | Директория хранения сохранённых артефактов. |

## Секреты

Держите API-ключи подальше от plaintext TOML с помощью
[`care migrate-secrets`](/ru/care/cli/setup/) — команда перемещает их в keychain ОС.
