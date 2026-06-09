---
title: Обнаружение и валидация
description: Список установленных возможностей, валидация цепочек и импорт файлов цепочек.
sidebar:
  order: 4
---

## `care catalog`

Список установленных AgentSkills, MCP-серверов, инструментов и карточек возможностей.

```bash
care catalog --json --kind skill
```

| Флаг | Назначение |
| --- | --- |
| `--json` | Вывод в машинночитаемом формате. |
| `--kind ...` | Фильтр по виду возможности. |

## `care validate <chain.json>`

Разобрать и провести preflight CARL-цепочки — поймать проблемы до запуска.

```bash
care validate chain.json
```

## `care import <pattern>...`

Пакетная валидация (dry-run по умолчанию) или импорт JSON-файлов цепочек в Memory.

```bash
care import "chains/*.json"            # dry-run валидация
care import "chains/*.json" --apply    # реальный импорт
```

| Флаг | Назначение |
| --- | --- |
| `--apply` | Импортировать (по умолчанию — dry-run валидация). |

Запустите `care <команда> --help` для полного списка флагов.
