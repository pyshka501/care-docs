---
title: Обзор CLI
description: Headless-интерфейс `care` — все подкоманды с одного взгляда.
sidebar:
  order: 1
---

`care` без подкоманды запускает TUI. Headless-подкоманды используют тот же
`CareConfig` и слои данных, что и TUI — у каждого экрана есть терминальный аналог.
Запустите `care <подкоманда> --help` для полного списка флагов.

## Настройка

| Команда | Назначение |
| --- | --- |
| `care init` | Быстрый старт: записать минимальный `.env` (или полный `config.toml` через `--toml`). |
| `care doctor` | Отчёт о здоровье окружения, конфига и зависимостей. |
| `care migrate-secrets` | Перенести plaintext API-ключи в keychain ОС. |

## Поиск и валидация

| Команда | Назначение |
| --- | --- |
| `care catalog` | Список установленных AgentSkills, MCP-серверов, инструментов, карточек возможностей. |
| `care validate <chain.json>` | Распарсить и preflight CARL-цепочки. |
| `care import <pattern>...` | Пакетная валидация (dry-run) или импорт JSON-цепочек. |

## Генерация / запуск / повтор

| Команда | Назначение |
| --- | --- |
| `care generate "<task>"` | Разовая генерация через MAGE. |
| `care run <chain_id>` | Получить сохранённую цепочку, preflight и опционально выполнить через CARL. |
| `care replay <run.json>` | Пройти по сохранённому `ReasoningResult` / `RunRecord`. |

## Просмотр Memory

| Команда | Назначение |
| --- | --- |
| `care memory ls` | Список сохранённых сущностей. |
| `care memory show <id>` | Детали одной сущности. |
| `care memory history <chain_id>` | История запусков цепочки. |
| `care search "<query>"` | Поиск BM25 / vector / hybrid по сущностям. |
| `care diff <left> <right>` | Сравнение цепочек бок о бок. |
| `care lineage <chain_id>` | Пройти по DAG предков. |
| `care favourite <id>` | Добавить/убрать звезду у сущности. |

## Возможности и эволюция

| Команда | Назначение |
| --- | --- |
| `care marketplace "<query>"` | Поиск по общим листингам `agent_skill`. |
| `care evolve <chain_id>` | Отправить + наблюдать + принять эволюционный прогон. |

## UX

| Команда | Назначение |
| --- | --- |
| `care help [--markdown]` | Показать туториал + шпаргалку. |

:::note
Детальные страницы по каждой команде ещё наполняются — см. [мастер-план](https://github.com/pyshka501/care-docs/blob/main/todo.md).
:::

:::note[Управляете `care` из агента?]
Установите [Agent Skill care-cli](/ru/care/skill/overview/) — он учит Claude Code или
hermes запускать все команды выше, с переносимым автоопределением `care`.
:::
