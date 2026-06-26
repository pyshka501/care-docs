---
title: Сценарии
description: Сквозные проработанные сценарии — от быстрого ответа до сборки, эволюции и выпуска агента.
sidebar:
  order: 3
---

Конкретные разборы основных способов использования MAESTRO. Они предполагают, что вы
выполнили [`care init`](/ru/care/cli/setup/) и запустили TUI командой `care`.

## 1. Быстрый разовый ответ (Interactive)

Самый быстрый путь — без настройки сверх учётных данных MAGE.

1. Оставайтесь в **Interactive** (поверхность по умолчанию).
2. Введите задачу, при необходимости прикрепив файлы через `@`:
   ```text
   Summarise the key risks in @report.pdf and rank them by severity.
   ```
3. Ответ печатается inline. Продолжайте в том же треде; `/new` начинает заново.

## 2. Поэкспериментируйте в Interactive и сохраните то, что сработало

Interactive выполняет цепочку **на месте** и ничего не сохраняет — пока вы сами этого не
захотите. Это естественное место, чтобы поэкспериментировать с цепочкой, прежде чем
зафиксировать её.

1. В **Interactive** введите задачу → MAGE генерирует → CARL выполняет → печатается ответ.
2. Дорабатывайте последующими промптами (они переиспользуют цепочку для контекста);
   разберите цепочку через [`/visualize`](/ru/care/slash-commands/overview/).
3. Когда цепочку стоит сохранить, нажмите кнопку действия **Save to library** — или сразу
   передайте её в эволюцию кнопкой **Evolve**, которая открывает то же окно запуска
   (с предпросмотром бюджета), описанное ниже.
4. Хотите поправить шаги вручную, а не генерировать заново? Выгрузите цепочку и отредактируйте
   JSON напрямую:
   ```bash
   care memory show <chain_id> --content-only > chain.json
   # отредактируйте chain.json — переставьте шаги, поправьте промпты, измените аргументы инструментов
   care validate chain.json                 # preflight перед повторным импортом
   care import chain.json --apply
   ```
   Либо упакуйте её в переносимый бандл командой [`care export`](/ru/care/cli/export/),
   чтобы перенести между машинами.

## 3. Сборка и эволюция Production-агента

Превратите задачу в сохранённого, эволюционирующего агента.

1. Переключитесь на Production: `/mode production` (нужна настроенная Memory).
2. Введите задачу → MAESTRO **генерирует → сохраняет** цепочку (вы получаете `chain_id`) →
   выполняет **baseline** → (если подключена Платформа) **запускает эволюцию**.
3. Следите за эволюцией на [дашборде эволюции](/ru/care/tui/evolution/) (или через
   `/evolution watch <run_id>` в чате) — живой график **приспособленности**, **фронт Парето**
   и **счётчик расходов**, который отслеживает траты в токенах/долларах относительно
   бюджета запуска.
4. Примите победителя: `/evolution accept <run_id> <individual_id>` (или
   `/promote <chain_id> <version>`).
5. Улучшенная цепочка теперь в вашей [Библиотеке](/ru/care/tui/screens/).

Headless-эквивалент:

```bash
care generate "Triage support tickets by severity" --save triage
care evolve triage --iterations 8 --wait --accept
```

## 4. Улучшение на основе датасета

Измеряйте, прежде чем оптимизировать.

1. В Production, после сохранения цепочки, добавьте тест-кейсы:
   ```text
   /dataset add <chain_id> "Checkout is down for everyone" --expected "high"
   /dataset add <chain_id> "Typo on the pricing page" --expected "low"
   ```
2. Оцените цепочку относительно них: `/dataset run <chain_id>`.
3. Эволюционируйте с датасетом в качестве сигнала фитнеса — **предпросмотр бюджета** в окне
   запуска заранее оценивает стоимость прогона, а **счётчик расходов** на
   [дашборде эволюции](/ru/care/tui/evolution/) отслеживает её вживую. После прогона
   перезапустите датасет, чтобы подтвердить прирост.
4. Экспортируйте набор для шеринга или версионирования: `/dataset export <chain_id> dataset.jsonl`.

## 5. Перезапуск сохранённого агента из Библиотеки

Переиспользуйте агента на новых входных данных.

1. `/library` (или `Ctrl+P` → поиск) → откройте сохранённую цепочку.
2. Используйте форму **Run context**, чтобы задать новую задачу + прикрепить контекстные файлы,
   затем запустите её. Или headless:
   ```bash
   care run <chain_id> --execute --task "New quarter, same analysis" --input region=EU
   ```
3. В Production прогон записывается; просмотрите историю через
   [`care memory history <chain_id>`](/ru/care/cli/memory/).

## 6. Ревизия существующей цепочки

Редактируйте цепочку на естественном языке вместо повторной генерации.

```text
/revise <chain_id> add a verification step before the final answer
```

MAESTRO показывает предпросмотр плана правки, вы подтверждаете, и она сохраняет
**новую версию**. (В Production обычный последующий промпт делает это автоматически
относительно текущей цепочки.) Продвиньте понравившуюся версию через `/promote`.

Нужен точечный контроль? Выгрузите цепочку, отредактируйте JSON вручную и импортируйте обратно:

```bash
care memory show <chain_id> --content-only > chain.json
# отредактируйте chain.json, затем:
care validate chain.json
care import chain.json --apply
```

Про перенос цепочек между машинами — см. [Экспорт и импорт бандлов](/ru/care/cli/export/).

## 7. Канонический мульти-агентный поток

Сквозной цикл, вокруг которого построена MAESTRO:

> Сгенерировать агента **A** → сохранить его → сгенерировать **B** и **C** → вернуться к **A**
> из Библиотеки → перезапустить его на той же задаче + контекстных файлах → **эволюционировать A**
> и **принять** лучшего индивида обратно в stable-канал.

## 8. Headless / CI

У всего есть терминальный аналог — это можно заскриптовать:

```bash
care doctor --no-probes                       # health check (offline)
care generate "<task>" --save my-agent --output agent.py
care validate agent.json                      # preflight a chain file
care run my-agent --execute --save-result run1
care search "triage" --search-type hybrid     # find saved agents
care evolve my-agent --wait --accept
```

## Смотрите также

- [Режим Production](/ru/care/workflows/production/) · [Ad-Hoc vs Production](/ru/care/workflows/modes/)
- [Справочник CLI](/ru/care/cli/overview/) · [Слэш-команды](/ru/care/slash-commands/overview/)
