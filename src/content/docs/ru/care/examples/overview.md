---
title: Примеры
description: Встроенные примеры цепочек и сквозной рабочий процесс MAESTRO.
sidebar:
  order: 1
---

MAESTRO поставляется с несколькими готовыми цепочками, которые можно валидировать, импортировать и запускать.

## Встроенные цепочки

| Пример | Что демонстрирует |
| --- | --- |
| **weather** | Агент погоды, подключённый к **MCP**-серверу (`mcp_servers.toml` + `chain.json`). |
| **financier** | Цепочка финансового анализа (`chain.json`) — многошаговый агент рассуждений над финансовыми данными. |

Каждый пример находится в директории `examples/` в [репозитории care](https://github.com/Glazkoff/care)
с `README.md`.

## Запуск файла цепочки

Любой `chain.json` следует одному потоку — валидировать, импортировать, запустить:

```bash
care validate examples/financier/chain.json      # preflight
care import examples/financier/chain.json --apply # в Memory
care run <chain_id> --execute --task "Analyse Q3 results"
```

Или пропустить Memory и просто провести preflight + экспорт:

```bash
care run <chain_id> --export chain.py             # экспорт в запускаемый модуль
```

## Сквозной рабочий процесс

Канонический цикл MAESTRO от начала до конца:

1. **Генерация** — введите задачу в [чате](/ru/care/tui/overview/) (или `care generate "<task>"`).
2. **Запуск** — Ad-Hoc запускает инлайн; Production сохраняет в [Библиотеку](/ru/care/tui/screens/).
3. **Перезапуск** — откройте сохранённую цепочку из Библиотеки и запустите на новых входных данных.
4. **Эволюция** — `care evolve <chain_id> --wait --accept` (или экран Эволюции) для
   улучшения, затем продвиньте победителя.

## Запись демо

`examples/asciicast/recording_script.md` содержит скрипт нажатий клавиш для записи
asciicast сессии MAESTRO.

## Смотрите также

- [CLI: генерация / запуск](/ru/care/cli/generate-run/) · [TUI](/ru/care/tui/overview/)
- [Книга рецептов CARL](/ru/carl/cookbook/overview/) — примеры цепочек на уровне библиотеки.
