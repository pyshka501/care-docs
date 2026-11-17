---
title: Обзор CLI
description: Командная строка Maestro — все подкоманды на одной странице и два имени программы.
sidebar:
  order: 1
---

У Maestro одна программа командной строки с двумя именами:

- **`maestro`** — основное имя. `uvx maestro-install` кладёт shim `maestro` в `PATH`.
- **`care`** — та же программа под старым именем пакета. Оставлена для скриптов,
  которые её уже вызывают. Все примеры ниже работают с любым из имён.

`maestro` **без подкоманды открывает приложение** (то же, что `maestro app`). Не
вызывайте его без подкоманды из скрипта или CI: откроется окно, и команда будет
ждать, пока его не закроют. Headless-подкоманды используют тот же конфиг
(`CareConfig`), ту же Memory, генерацию и исполнение, что и приложение. Полный
список флагов каждой команды: `maestro <подкоманда> --help`.

```bash
maestro --version        # например, "maestro 0.5.0"
maestro doctor           # проверить окружение
maestro generate "weather report for SF" --save weather
```

## Интерфейсы

| Команда | Назначение |
| --- | --- |
| `maestro` / `maestro app` | Открыть приложение (основной интерфейс). |
| `maestro tui` | Открыть терминальный интерфейс Textual (поддерживается как дополнительный). |
| `maestro web` | Поднять локальный браузерный интерфейс на `127.0.0.1:8787`. |

Подробнее: [Запуск интерфейсов](/ru/care/cli/app/).

## Настройка

| Команда | Назначение |
| --- | --- |
| `maestro init` | Быстрый старт: записать минимальный `.env` с ключом модели. |
| `maestro doctor` | Окружение, конфиг, extras и проверки сервисов (включая серверы STARM). |
| `maestro migrate-secrets` | Перенести ключи из `config.toml` в keychain ОС. |

## Поиск и валидация

| Команда | Назначение |
| --- | --- |
| `maestro catalog` | Установленные AgentSkills, MCP-серверы, инструменты и карточки памяти. |
| `maestro validate <chain.json>` | Разобрать файл цепочки и выполнить preflight. |
| `maestro import <pattern>...` | Проверить JSON-цепочки; с `--apply` сохранить их в Memory. |
| `maestro export <output> <chain_id>...` | Упаковать цепочки (и навыки) в tarball. |

## Генерация, правка, запуск, повтор

| Команда | Назначение |
| --- | --- |
| `maestro generate "<task>"` | Сгенерировать цепочку по описанию задачи. |
| `maestro revise <chain_id> "<edit>"` | Изменить сохранённую цепочку словами, получить новую версию. |
| `maestro compose <id> <id>...` | Склеить сохранённые цепочки в одну (последовательно или параллельно). |
| `maestro run <chain_id>` | Получить цепочку, выполнить preflight и при желании запустить. |
| `maestro replay <run.json>` | Пройти по сохранённому `ReasoningResult` / `RunRecord`. |

## Memory и библиотека

| Команда | Назначение |
| --- | --- |
| `maestro memory ls` | Список сохранённых сущностей. |
| `maestro memory show <id>` | Одна сущность целиком. |
| `maestro memory history <chain_id>` | Записанные запуски цепочки. |
| `maestro search "<query>"` | Поиск BM25 / vector / hybrid. |
| `maestro diff <left> <right>` | Сравнить две цепочки. |
| `maestro lineage <chain_id>` | Пройти по предкам цепочки. |
| `maestro favourite <id>` | Поставить или снять звезду. |

## Версии и долговременная память

| Команда | Назначение |
| --- | --- |
| `maestro versions <id>` | История версий и куда указывают каналы. |
| `maestro rollback <id> --to <version>` | Перевести канал на версию (закрепление, ничего не удаляется). |
| `maestro promote <id>` | Скопировать указатель канала (по умолчанию `latest` → `stable`). |
| `maestro forget <id>` | Мягко удалить сущность (без `--force` только предпросмотр). |
| `maestro remember "<text>"` | Сохранить заметку в долговременную память. |
| `maestro notes` | Показать дайджест долговременной памяти. |

## Маркетплейс и эволюция

| Команда | Назначение |
| --- | --- |
| `maestro marketplace "<query>"` | Поиск по общим `agent_skill`. |
| `maestro evolve <chain_id>` | Запустить эволюцию, следить за ней и принять победителя. |

## Датасеты и деплой

| Команда | Назначение |
| --- | --- |
| `maestro dataset list\|add\|run\|export` | Eval-датасет цепочки: ведение и оценка. |
| `maestro deploy <chain_id>` | Развернуть цепочку на agent hub как HTTP-агента. |
| `maestro deployments` | Агенты на hub. |
| `maestro metrics [name]` | Использование и стоимость развёрнутых агентов. |

## Справка

| Команда | Назначение |
| --- | --- |
| `maestro help [--markdown] [--commands]` | Туториал и шпаргалка клавиш или таблица CLI ↔ TUI. |

:::note[Чего нет в CLI]
Подкоманд `setup`, `discovery`, `capabilities` и `benchmark` нет. Страницы с такими
названиями в этом разделе просто группируют связанные команды. Генерация бенчмарков
и датасетов, работа с идеями IdeaL и мастерская инструментов есть только в
приложении.
:::

:::tip
Подробные страницы: [Запуск интерфейсов](/ru/care/cli/app/) ·
[Генерация, запуск и повтор](/ru/care/cli/generate-run/) · [Revise](/ru/care/cli/revise/) ·
[Compose](/ru/care/cli/compose/) · [Настройка](/ru/care/cli/setup/) ·
[Поиск и валидация](/ru/care/cli/discovery/) · [Экспорт и импорт](/ru/care/cli/export/) ·
[Memory и библиотека](/ru/care/cli/memory/) · [Датасеты](/ru/care/cli/dataset/) ·
[Деплой и метрики](/ru/care/cli/deploy/) · [Маркетплейс, эволюция и справка](/ru/care/cli/capabilities/).
:::

:::note[Управляете CLI из агента?]
Установите [агентный навык Maestro](/ru/care/skill/overview/). Он учит Claude Code,
Codex, hermes или OpenClaw запускать эти команды и сам находит программу.
:::
