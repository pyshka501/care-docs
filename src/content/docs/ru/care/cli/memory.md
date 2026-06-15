---
title: Memory и Библиотека
description: Просмотр, поиск, сравнение и курирование сохранённых сущностей.
sidebar:
  order: 5
---

Эти команды читают хранилище GigaEvo Memory — библиотеку сохранённых цепочек,
агентов, навыков и записей запусков. Каждая из них является терминальным аналогом
экрана Библиотеки TUI.

## `care memory ...`

```bash
care memory ls --entity-type chain --tag finance --q "weather"
care memory show <entity_id> --content-only
care memory history <chain_id>
```

| Подкоманда | Назначение |
| --- | --- |
| `memory ls` | Список сохранённых сущностей (фильтры `--entity-type`, `--tag`, `--q`). |
| `memory show <id>` | Детали одной сущности (`--content-only`). |
| `memory history <chain_id>` | Список записанных запусков цепочки. |

## `care search "<query>"`

Поиск BM25 / vector / hybrid по сохранённым сущностям.

```bash
care search "quarterly risk" --search-type hybrid
```

| Флаг | Назначение |
| --- | --- |
| `--search-type bm25\|vector\|hybrid` | Бэкенд поиска. |

## Сравнение и курирование

```bash
care diff <left_id> <right_id>     # сравнение цепочек бок о бок
care lineage <chain_id>            # пройти по DAG предков
care favourite <entity_id>         # добавить звезду сущности (--off чтобы убрать)
```

Запустите `care <команда> --help` для полного списка флагов.
