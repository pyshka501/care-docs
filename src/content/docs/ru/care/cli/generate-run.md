---
title: Генерация, запуск и воспроизведение
description: Сгенерировать цепочку из задачи, запустить сохранённую цепочку, экспортировать её и воспроизвести результаты.
sidebar:
  order: 2
---

Основной цикл генерация → запуск, а также экспорт цепочек на диск и воспроизведение прошлых запусков.

## `care generate "<task>"`

Сгенерировать CARL-цепочку из произвольной задачи через MAGE.

```bash
care generate "weather report for SF" --save weather --output weather.json
```

| Флаг | Назначение |
| --- | --- |
| `--mode fast\|deep` | Режим генерации MAGE (по умолчанию — собственный дефолт MAGE). |
| `--save NAME` | Сохранить сгенерированную цепочку в Memory под именем `NAME` (новая сущность). |
| `--output PATH` | Записать цепочку в файл (формат выводится из расширения `.json` / `.py`). |
| `--output-format json\|python` | Переопределить формат экспорта. |
| `--json` | Вывести цепочку как JSON вместо сводной строки. |

:::note[Где `care export`?]
Отдельной подкоманды `export` нет — экспортируйте сгенерированную цепочку через
`generate --output PATH` или экспортируйте *сохранённую* цепочку через `run --export PATH`
(ниже). Оба варианта записывают `.json` или `.py` (запускаемый Python-модуль) в
зависимости от расширения.
:::

## `care run <chain_id>`

Получить сохранённую цепочку из Memory, провести preflight и опционально выполнить её.

```bash
care run my-chain --execute --input city=Paris --save-result paris-run
care run my-chain --export chain.py            # экспорт, без запуска
```

| Флаг | Назначение |
| --- | --- |
| `--channel NAME` | Версионный канал для чтения (по умолчанию `latest`). |
| `--execute` | Выполнить через CARL после preflight (требует `mmar_carl` + ключ LLM). |
| `--task TEXT` | Переопределить `outer_context` для запуска. |
| `--input KEY=VALUE` | Добавить пару в `context.memory['input']` (повторяемый). |
| `--save-result NAME` | Сохранить дайджест запуска как `memory_card` (требует `--execute`). |
| `--export PATH` | Также записать полученную цепочку в файл (`.json` / `.py`). |
| `--export-format json\|python` | Переопределить формат экспорта. |
| `--json` | Вывести результат preflight как JSON. |
| `--log PATH` / `--log-level debug\|info` | Записать структурированный отладочный лог запуска. |

## `care replay <run.json>`

Пройти по сохранённому `ReasoningResult` / `RunRecord` JSON из предыдущего запуска.

```bash
care replay run.json
```

Запустите `care <команда> --help` для актуального полного набора флагов.
