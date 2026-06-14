---
title: Режим Production
description: Полный жизненный цикл Production — генерация, сохранение, baseline, датасет, эволюция, продвижение.
sidebar:
  order: 2
---

Режим Production превращает разовую генерацию в **долговечного, измеримого, улучшаемого
агента**. Это путь, который вы используете, когда хотите сохранить цепочку, протестировать
её, эволюционировать и выпустить лучшую версию.

## Что происходит на промпте в Production

Когда вы вводите задачу в режиме Production, MAESTRO CARE автоматически выполняет такую
последовательность:

1. **Генерация** — MAGE создаёт **воспроизводимую** цепочку (без цикла ReAct, без
   синтеза ответа — цепочки Production должны выполняться одинаково каждый раз).
2. **Сохранение в artifact store** — цепочка попадает в хранилище артефактов сессии
   (её видят пилюля в заголовке и [`/artifacts`](/ru/care/slash-commands/overview/)).
3. **Сохранение** — цепочка сохраняется в Memory под стабильным **`chain_id`** с
   отображаемым именем. (Дубликат существующей цепочки → без повторного сохранения.)
4. **Baseline** — MAESTRO CARE выполняет **один baseline-прогон** и сохраняет его как
   **первую запись датасета** для этой цепочки.
5. **Эволюция** — если подключена [Платформа](/ru/care/concepts/architecture/) и
   baseline прошёл успешно, MAESTRO CARE **запускает эволюционный прогон** относительно baseline.

После этого цепочка живёт в вашей [Библиотеке](/ru/care/tui/screens/) под своим `chain_id`.

:::tip[Итерация против начала с нуля]
Ваш **следующий обычный промпт** в Production не генерирует совершенно новую цепочку — он
**ревизует только что сохранённую цепочку** (через [`/revise`](/ru/care/slash-commands/overview/)),
создавая **новую версию**. Чтобы начать действительно новую цепочку, сначала выполните `/new`.
:::

## Требования и откат

- **Memory обязательна**: `CARE_MEMORY__BASE_URL` (+ `CARE_MEMORY__API_KEY`, если включена
  аутентификация). Без неё выбор Production **автоматически откатывается к Ad-Hoc** с
  предупреждением.
- **Платформа опциональна**: эволюция запускается только при заданном `CARE_PLATFORM__BASE_URL`;
  иначе сохранение + baseline всё равно происходят, а эволюция пропускается.

## Каналы и версии

Сохранённые цепочки **версионируются**. Правки (через `/revise`) создают новые версии;
канал `latest` всегда указывает на самую новую. Продвиньте выбранную версию (или победителя
эволюции) в **stable**-канал с помощью [`/promote`](/ru/care/slash-commands/overview/).
Чтения CLI учитывают `--channel` (по умолчанию `latest`) — например, [`care run <id> --channel stable`](/ru/care/cli/generate-run/).

## Команды Production

Они появляются в режиме Production (полный список — в разделе
[слэш-команды → production](/ru/care/slash-commands/production/)):

### Датасеты — измеряйте качество

```text
/dataset add <chain_id> "<task>" --expected "<out>" [--rubric "<prompt>"]
/dataset list <chain_id>
/dataset run <chain_id>          # replay every entry + score it
/dataset export <chain_id> <path>   # write entries as JSONL
```

Baseline-прогон засевает запись №1; добавьте больше кейсов, затем `/dataset run`, чтобы
оценить цепочку относительно них. Двойник CLI собирает + оценивает датасеты headless.

### Эволюция — улучшайте автоматически

```text
/evolution <run_id>              # render the run's state inline
/evolution watch <run_id>        # stream events live
/evolution accept <run_id> <individual_id>   # promote the winner
```

Или headless: [`care evolve <chain_id> --wait --accept`](/ru/care/cli/capabilities/).

### Жизненный цикл

```text
/revise [<id>] <change>          # edit the chain in natural language → new version
/promote <id> <version>          # promote a version / winner to the stable channel
/upload <chain_id>               # POST the chain to CARE_UPLOAD__URL
/forget <chain_id> [--force]     # soft-delete the chain + its dataset
```

## Смотрите также

- [Сценарии](/ru/care/workflows/scenarios/) — сквозные проработанные примеры.
- [Ad-Hoc vs Production](/ru/care/workflows/modes/) · [Архитектура](/ru/care/concepts/architecture/)
