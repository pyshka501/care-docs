---
title: Команды Production
description: Slash-команды для датасетов, эволюции, релиза и жизненного цикла цепочек, сохранённых в режиме Production.
sidebar:
  order: 2
---

В режиме **Production** каждый запрос даёт цепочку, сохранённую в Memory под
стабильным `chain_id`, с базовым запуском в качестве первой записи датасета.
Команды ниже работают с такими цепочками. Они зарегистрированы в обоих режимах,
а `/help` показывает их в Production. См. [Режимы](/ru/care/workflows/modes/).

:::note
Для Production нужен `CARE_MEMORY__BASE_URL` (и `CARE_MEMORY__API_KEY`, если сервер
требует авторизацию). Без Memory переключение в Production с предупреждением
возвращает в Interactive, а команды, которым нужна Memory, сообщают, что она не
настроена.
:::

## Датасеты

| Команда | Что делает |
| --- | --- |
| `/dataset list <chain_id>` | Записи датасета цепочки. |
| `/dataset add <chain_id> "<task>" --expected "<out>" [--rubric "<prompt>"]` | Добавить случай. `--rubric` используется прогоном в TUI как промпт для LLM-судьи. |
| `/dataset run <chain_id>` | Прогнать все записи через цепочку и оценить. |
| `/dataset export <chain_id> <path>` | Записать записи в JSONL. |

Аналог в CLI — [`maestro dataset`](/ru/care/cli/dataset/). Он игнорирует `--rubric`
и оценивает по вхождению подстроки.

## Эволюция

| Команда | Что делает |
| --- | --- |
| `/evolution` | Вводная, затем панель запусков. |
| `/evolution setup [<chain_id>]` | Окно запуска, при желании сразу для цепочки. |
| `/evolution list` | Панель запусков. |
| `/evolution <run_id>` | Состояние запуска прямо в чате. |
| `/evolution watch <run_id>` | Поток событий запуска в чат, пока он не закроется или пока вы не нажмёте Esc. |
| `/evolution accept <run_id> <individual_id>` | Продвинуть эту особь в канал `stable`. |

См. [Экран эволюции](/ru/care/tui/evolution/).

## Релиз

| Команда | Что делает |
| --- | --- |
| `/versions <id\|name> [diff <vA> <vB>]` | История версий; `diff` показывает JSON-патч. |
| `/promote <id\|name> [--from latest] [--to stable] [--force]` | Релиз канала с проверкой. |
| `/rollback <id\|name> [--channel stable] [--to <version-id>]` | Перевести канал на версию назад или на указанную. |
| `/deploy <id\|name> [--channel stable] [--name x]` | Развернуть на [agent hub](/ru/care/workflows/deploy/). |

Перед переводом канала `/promote` проверяет кандидата: загружается ли он с
шаблонным набором инструментов, делает обязательный базовый запуск, сравнивает
оценки с базовыми, если оценки есть, и только потом продвигает. `--force`
пропускает проверку. Команда CLI [`maestro promote`](/ru/care/cli/memory/) проверки
не делает и переводит канал сразу.

## Жизненный цикл

| Команда | Что делает |
| --- | --- |
| `/upload <chain_id>` | Отправить JSON цепочки POST-запросом на URL из `[upload]` / `CARE_UPLOAD__URL`. |
| `/forget <chain_id>` | Показать, что будет удалено. |
| `/forget <chain_id> --force` | Мягко удалить цепочку **и** все карточки датасета с тегом `dataset-entry:<chain_id>`. Восстанавливается из корзины Memory. |
