---
title: Режим Production
description: Режим Production в TUI — генерация, сохранение, базовый прогон, набор данных, эволюция и выпуск постоянной цепочки.
sidebar:
  order: 2
---

Production — режим TUI для цепочек, которые вы хотите оставить, измерять и
улучшать. Ему нужна Memory. В приложении те же шаги — отдельные просьбы к
агенту. См. [Сценарии](/ru/care/workflows/scenarios/).

## Что делает запрос в Production

1. **Генерирует** воспроизводимую цепочку (без цикла агента: она должна
   каждый раз работать одинаково).
2. **Спрашивает один раз** перед запуском (этап `run` по умолчанию `ask`).
3. **Сохраняет** её в Memory под постоянным `chain_id`. Если та же задача уже
   сохранена, TUI показывает существующую цепочку, а не сохраняет дубликат.
   Чтобы всё равно сохранить, начните задачу с `[FORCE]`.
4. **Базовый прогон**: запускает её один раз и записывает прогон первой
   записью набора данных.
5. **Эволюция**: если платформа настроена и базовый прогон успешен,
   запускает эволюцию.

Следующий обычный запрос **правит** сохранённую цепочку в новую версию.
`/new` начинает новую цепочку.

## Требования

- Memory: `CARE_MEMORY__BASE_URL` (и `CARE_MEMORY__API_KEY`, если сервер его
  требует). Без неё TUI с предупреждением возвращается в Interactive.
- Платформа (по желанию): `CARE_PLATFORM__BASE_URL`. Без неё сохранение и
  базовый прогон выполняются, эволюция пропускается.

## Версии и каналы

У сохранённых цепочек есть версии. Правки создают новые версии, канал
`latest` указывает на самую новую. `stable` — выпущенная. CLI по умолчанию
читает `latest`; для `maestro run` передайте `--channel stable`.

```text
/revise <id> <change>        # правка на естественном языке → новая версия
/promote <id|name> [--force] # выпуск latest → stable с проверкой
/rollback <id|name> [--to <vid>]
```

## Наборы данных

```text
/dataset list <chain_id>
/dataset add <chain_id> "<task>" --expected "<out>" [--rubric "<prompt>"]
/dataset run <chain_id>              # прогнать все записи и оценить
/dataset export <chain_id> <path>    # записать записи в JSONL
```

Базовый прогон создаёт первую запись. Эти наборы TUI хранятся как карточки
памяти. Они отделены от [данных для эволюции](/ru/care/workflows/data-generation/),
которые генерирует приложение.

## Эволюция

```text
/evolution                       # панель активных и недавних прогонов
/evolution setup [<chain_id>]    # выбор запуска с оценкой бюджета
/evolution list
/evolution <run_id>              # состояние одного прогона
/evolution watch <run_id>        # поток событий
/evolution accept <run_id> <individual_id>
```

[Панель эволюции](/ru/care/tui/evolution/) показывает график fitness, фронт
Парето, программы и версии. Принятие победителя переводит его в канал
`stable`. Без интерфейса:

```bash
maestro evolve <chain_id> --iterations 8 --wait --accept
```

## Выпуск и доставка

```text
/deploy <id|name> [--channel stable]   # HTTP-агент в хабе
/upload <chain_id>                     # POST JSON цепочки на CARE_UPLOAD__URL
/forget <chain_id> [--force]           # мягкое удаление (восстановимо в Memory)
```

См. [Развёртывание агентов](/ru/care/workflows/deploy/).

## См. также

- [Режимы Interactive и Production](/ru/care/workflows/modes/)
- [Slash-команды → production](/ru/care/slash-commands/production/)
- [Сценарии](/ru/care/workflows/scenarios/)
