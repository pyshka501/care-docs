---
title: Примеры
description: Примеры цепочек из поставки Maestro и как ими пользоваться из приложения и CLI.
sidebar:
  order: 1
---

В репозитории Maestro есть примеры цепочек в `examples/`, у каждого свой
`README.md`.

| Пример | Что показывает | `maestro validate` |
| --- | --- | --- |
| `weather` | Один шаг `mcp` (MCP-сервер погоды из `mcp_servers.toml`) и один шаг `llm`, который пересказывает результат. | ok (1 MCP-сервер) |
| `financier` | Читает квартальный отчёт из PDF навыком, извлекает показатели шагом `structured_output` по JSON Schema. В `skills/` лежит пример навыка. | сообщает о недостающем инструменте `pdf_extractor`, пока вы его не добавите |
| `summarizer` | Цепочка из одного шага `llm`, читающего `$outer_context`, с набором `eval.jsonl` из 8 примеров; используется как исходная цепочка для эволюции. README на русском. | ok |
| `asciicast` | Сценарий нажатий и каталог с исходными данными для записи демо CLI. | — |

Столбец `validate` — то, что вывела команда
`maestro validate examples/<name>/chain.json` на базе релиза.

## Проверка, импорт, запуск (CLI)

```bash
maestro validate examples/weather/chain.json          # разбор + preflight
maestro import examples/weather/chain.json --apply    # сохранить в Memory
maestro run <chain_id> --execute --task "Weather in Paris"
```

`maestro run <chain_id> --export chain.py` дополнительно пишет полученную
цепочку как модуль Python (`.json` — как JSON).

## Пример в приложении

Импортируйте цепочку через CLI, как выше, затем откройте её в
**Библиотека → Цепочки** и нажмите **Запустить**. Или приложите `chain.json`
к чату и попросите агента проверить и запустить её. Агент подготовит именно
этот файл и спросит подтверждение перед запуском.

Для эволюции у примера `summarizer` есть готовый набор данных
(`eval.jsonl`). Набор можно и сгенерировать в приложении, см.
[Данные для эволюции](/ru/care/workflows/data-generation/).

## Запись демо

```bash
scripts/record_demo.sh
```

Список нажатий по актам — `examples/asciicast/recording_script.md`. Запись
сохраняется в `docs/asciicasts/care-tour.cast`.

## См. также

- [Сценарии](/ru/care/workflows/scenarios/): сквозные сценарии.
- [CLI: генерация и запуск](/ru/care/cli/generate-run/).
- [Кулинарная книга CARL](/ru/carl/cookbook/overview/): примеры цепочек на уровне библиотеки.
