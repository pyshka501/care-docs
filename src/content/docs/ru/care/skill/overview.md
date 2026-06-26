---
title: Обзор
description: Скилл Maestro — установите его, чтобы Claude Code или hermes управляли Maestro, с переносимым автоопределением `care`.
sidebar:
  order: 1
---

**maestro** — это **Agent Skill** в формате [agentskills.io](https://agentskills.io):
небольшой бандл, который учит агента (Claude Code или
[hermes](https://github.com/nousresearch/hermes-agent) от NousResearch) управлять
Maestro из headless-команды [`care`](/ru/care/cli/overview/) — генерировать и запускать
цепочки, смотреть память, эволюционировать цепочки и **интерпретировать и
визуализировать** их — без жёсткой привязки к пути до Maestro.

:::tip[Установка одной командой]
```bash
uvx maestro-install skill
```
Скачивает и распаковывает скилл для Claude Code / Codex / hermes / OpenClaw (выбор —
`--agent`). Подробно: [Установка и использование](/ru/care/skill/install/). (Прямой бандл:
[`maestro.skill`](https://airi-maestro.github.io/care-docs/maestro.skill).)
:::

## Что внутри бандла

```
maestro/
├── SKILL.md                      # когда срабатывать + карта команд и сценарии
├── scripts/
│   ├── care.sh                   # переносимый лаунчер, находит `care`
│   └── viz_chain.py              # JSON цепочки → Mermaid-граф + таблица шагов
└── references/
    ├── commands.md               # все подкоманды и флаги
    ├── production-and-tui.md      # Ad-Hoc vs Production, slash-команды TUI
    ├── chain-format.md            # JSON цепочки: типы шагов, $-ссылки
    ├── interpret.md              # интерпретация + визуализация цепочки (граф + по шагам)
    └── integration.md             # встраивание в hermes / CI / другие хосты
```

## Что умеет агент с этим скиллом

| Область | Скилл вызывает |
| --- | --- |
| **Генерация / запуск** | `care generate "<задача>"`, preflight или `run --execute` с `--input`, `replay`, экспорт в `.json`/`.py` |
| **Память и библиотека** | `memory ls/show/history`, `search`, `diff`, `lineage`, `favourite` |
| **Валидация / импорт** | `validate <chain.json>`, `import '<glob>' [--apply]` |
| **Эволюция** | `catalog`, `marketplace`, `evolve … --wait --accept` |
| **Настройка / диагностика** | `doctor`, `init`, `migrate-secrets` |

Скилл также несёт знание, которое делает эти команды надёжными: различие
[Ad-Hoc vs Production](/ru/care/workflows/modes/), честную карту того, что доступно из
CLI, а что [только в TUI](/ru/care/slash-commands/overview/) (revise / dataset /
promote / upload / forget), [формат цепочек](/ru/carl/chains/overview/) и практические
подводные камни (у `doctor`/`init` нет `--json`; на свежей памяти индекс `search` пуст —
используйте `memory ls --q`; передавайте абсолютные пути к файлам, т.к. лаунчер может
запускать `care` из воркспейса).

## Помимо CLI: интерпретация и визуализация

После генерации цепочки скилл предлагает больше, чем сырой JSON — первым делом
**интерпретировать и визуализировать** её (а ещё может запустить или эволюционировать):

- **Интерпретация и визуализация — вместе** — рендер DAG зависимостей (собственный
  `to_mermaid` Maestro, плюс критический путь и хитмапы по токенам / задержке /
  стоимости, если передать прогон) **и** разбор каждого шага простым языком: что делает,
  что читает по `$`-ссылкам, что отдаёт и почему от чего зависит. Граф даёт форму,
  пошаговые заметки — смысл, как одно объяснение. Интерпретирует сам агент, поэтому
  работает даже без ключа модели и сервисов. Например, двухшаговая цепочка про погоду:

  ```mermaid
  flowchart TD
      S1["1 · fetch_forecast<br/>mcp"]
      S2["2 · summarise_forecast<br/>llm"]
      S1 --> S2
  ```

- **Запуск / эволюция** — выполнить цепочку на примере (`care run --execute`) или
  улучшить автоматически (`care evolve --wait --accept`).

## Переносимость по умолчанию

`scripts/care.sh` находит `care` одинаково в любом окружении, поэтому скилл работает на
машине разработчика, в CI или внутри hermes без правок:

1. глобальный `care` в `PATH` (его ставит [`uvx maestro-install`](/ru/care/getting-started/quick-start/)
   в виде шима), иначе
2. локальный чекаут (через `$CARE_HOME` или типовые пути), иначе
3. опубликованный пакет напрямую: `uvx --from maestro-care care`.

Если ничего из этого нет — печатает понятную подсказку, а не падает молча. Настройка —
на странице [Установка и использование](/ru/care/skill/install/).
