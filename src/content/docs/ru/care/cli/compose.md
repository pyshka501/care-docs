---
title: Склейка цепочек
description: Собрать из двух и более сохранённых цепочек одну новую, последовательно или параллельно с шагом-агрегатором.
sidebar:
  order: 2.7
---

`maestro compose` собирает новую цепочку из двух и более сохранённых. Команда
получает каждую цепочку из Memory и сводит их в один граф:

- **`sequential`** (по умолчанию) — цепочки идут друг за другом в указанном
  порядке. Каждый первый шаг цепочки зависит от всех последних шагов предыдущей.
- **`parallel`** — цепочки работают независимо, а финальный LLM-шаг-агрегатор
  объединяет их результаты.

Как и [`revise`](/ru/care/cli/revise/), по умолчанию команда только **показывает**
результат. Чтобы сохранить его в библиотеку новой цепочкой, добавьте `--yes`.

```bash
maestro compose fetch-news summarise-news                     # предпросмотр
maestro compose fetch-news summarise-news --name news-digest --yes
maestro compose weather-sf weather-nyc --mode parallel \
  --aggregator-aim "Compare the two forecasts in one table" --yes
maestro compose a b c --json | jq '.steps | length'
```

| Флаг | По умолчанию | Назначение |
| --- | --- | --- |
| `CHAIN_ID ...` | — | Два и более `entity_id` цепочек по порядку. Повторы отбрасываются. |
| `--mode sequential\|parallel` | `sequential` | Как соединять цепочки. |
| `--name NAME` | генерируется | Имя новой цепочки. |
| `--aggregator-aim TEXT` | — | Своя цель шага-агрегатора (режим parallel). |
| `--channel NAME` | `latest` | Канал Memory, из которого читаются цепочки. |
| `--yes` | выкл. | Сохранить результат (по умолчанию только предпросмотр). |
| `--json` | выкл. | Напечатать цепочку как JSON. Служебные сообщения тогда идут в stderr, stdout остаётся чистым JSON. |

Предпросмотр показывает каждый шаг результата с типом и зависимостями:

```text
Composed (sequential) 2 chains -> 'news-digest': 5 steps
  1. [tool] Fetch headlines  deps=[]
  ...

Preview only — re-run with --yes to save this to the library.
```

Сохранённая цепочка получает теги `composed` и `compose:<mode>`, а в описании
изменения перечислены исходные цепочки. Найти её можно так:
`maestro memory ls --tag composed`.

Код выхода `2`, если передано меньше двух разных id, цепочку не удалось получить
или в ней нет шагов, либо не удалось сохранить результат. Сама склейка локальная и
модель не вызывает. Агрегатор режима parallel — LLM-шаг, он работает при запуске
цепочки.

## См. также

- [Revise](/ru/care/cli/revise/) — правка одной цепочки словами.
- [Memory и библиотека](/ru/care/cli/memory/) — найти id цепочек и посмотреть результат.
