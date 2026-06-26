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
| `care init` | Быстрый старт: записать минимальный `.env`. |
| `care doctor` | Отчёт о здоровье окружения, конфига и зависимостей. |
| `care migrate-secrets` | Перенести plaintext API-ключи в keychain ОС. |

## Поиск и валидация

| Команда | Назначение |
| --- | --- |
| `care catalog` | Список установленных AgentSkills, MCP-серверов, инструментов, карточек возможностей. |
| `care validate <chain.json>` | Распарсить и preflight CARL-цепочки. |
| `care import <pattern>...` | Пакетная валидация (dry-run) или импорт JSON-цепочек. |
| `care export <output> <chain_id>...` | Упаковать цепочки (и навыки) в tarball; `import` — обратная операция. |

## Генерация / запуск / повтор

| Команда | Назначение |
| --- | --- |
| `care generate "<task>"` | Разовая генерация через MAGE. |
| `care run <chain_id>` | Получить сохранённую цепочку, preflight и опционально выполнить через CARL. |
| `care revise <chain_id> "<edit>"` | Отредактировать сохранённую цепочку с помощью ИИ в новую версию (аналог `/revise`). |
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

## Версии и долговременная память

| Команда | Назначение |
| --- | --- |
| `care versions <chain_id>` | Список версий и каналов сущности. |
| `care rollback <chain_id>` | Вернуть на канал более раннюю версию. |
| `care promote <chain_id>` | Продвинуть версию в стабильный канал. |
| `care forget <id>` | Мягкое удаление (tombstone) сущности. |
| `care remember "<text>"` | Записать заметку в долговременную память. |
| `care notes` | Вывести дайджест долговременной памяти. |

## Маркетплейс и эволюция

| Команда | Назначение |
| --- | --- |
| `care marketplace "<query>"` | Поиск по общим листингам `agent_skill`. |
| `care evolve <chain_id>` | Отправить + наблюдать + принять эволюционный прогон. |

## Деплой и датасеты

| Команда | Назначение |
| --- | --- |
| `care deploy <chain_id>` | Задеплоить цепочку в agent-hub по HTTP. |
| `care deployments` | Список активных деплоев в agent-hub. |
| `care metrics <deployment>` | Метрики использования деплоя. |
| `care dataset <chain_id> ...` | Управление и запуск eval-датасета цепочки (list/add/run/export). |

## UX

| Команда | Назначение |
| --- | --- |
| `care help [--markdown] [--commands]` | Показать туториал + шпаргалку или таблицу соответствия CLI ↔ TUI. |

:::tip
Детальные страницы (в боковом меню): [Генерация, запуск и повтор](/ru/care/cli/generate-run/) ·
[Настройка](/ru/care/cli/setup/) · [Поиск и валидация](/ru/care/cli/discovery/) ·
[Revise](/ru/care/cli/revise/) · [Экспорт и импорт](/ru/care/cli/export/) ·
[Memory и Библиотека](/ru/care/cli/memory/) · [Датасеты](/ru/care/cli/dataset/) ·
[Деплой и метрики](/ru/care/cli/deploy/) · [Возможности и эволюция](/ru/care/cli/capabilities/).
:::

:::note[Управляете `care` из агента?]
Установите [Agent Skill care-cli](/ru/care/skill/overview/) — он учит Claude Code или
hermes запускать все команды выше, с переносимым автоопределением `care`.
:::
