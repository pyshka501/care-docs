---
title: Развёртывание в agent hub
description: Headless-аналоги /deploy, /deployments и /metrics — отправьте цепочку в agent hub и осмотрите её из терминала.
sidebar:
  order: 6.7
---

Это терминальные аналоги экранов **agent hub**: `maestro deploy`,
`maestro deployments` и `maestro metrics` повторяют команды TUI `/deploy`,
`/deployments` и `/metrics`. Развёрнутая цепочка обслуживается в хабе как
HTTP-агент с собственным Swagger UI.

:::caution[В headless-режиме хаб не запускается автоматически]
TUI поднимает agent hub за вас при первом `/deploy`. CLI этого **не делает** —
за headless-командой нет фонового процесса. Хаб уже должен быть запущен, иначе
каждая из этих команд завершится сообщением `hub is not running` и **кодом
выхода 2**. Установку, настройку и автозапуск хаба внутри TUI см. в
[Развёртывании агентов](/ru/care/workflows/deploy/).
:::

## `maestro deploy <chain_id>`

Разворачивает сохранённую цепочку в agent hub как HTTP-агента. Команда
генерирует `api_key`; затем хаб сам забирает цепочку по `entity_id` на указанном
канале и проверяет, что она загружается (отказ выводится здесь же).

```bash
maestro deploy weather-risk --name weather-risk --channel stable
```

| Флаг | По умолчанию | Назначение |
| --- | --- | --- |
| `chain_id` | — | `entity_id` цепочки в Memory для развёртывания. |
| `--name NAME` | slug из `chain_id` | Имя агента в хабе. |
| `--channel C` | `stable` | Канал для развёртывания — в production уходит выпущенная версия, а не dev-вершина. |

При успехе выводятся имя развёрнутого агента, его **URL** и ссылка на страницу
`/docs` (Swagger). Флага **`--json` у этой команды нет**.

## `maestro deployments`

Список агентов, которые сейчас есть в хабе: для каждого развёртывания — индикатор
готовности, URL, версия и число запусков.

```bash
maestro deployments
maestro deployments --json
```

| Флаг | По умолчанию | Назначение |
| --- | --- | --- |
| `--json` | выкл. | Выводить JSON вместо списка с индикаторами. |

## `maestro metrics [name]`

Метрики использования / стоимости. Передайте **имя** агента, чтобы прочитать его
`/metrics`; опустите его, чтобы получить сводку по числу запусков всех
развёртываний.

```bash
maestro metrics weather-risk        # метрики одного агента
maestro metrics                     # сводка по запускам всего хаба
maestro metrics --json
```

| Флаг | По умолчанию | Назначение |
| --- | --- | --- |
| `name` | — | Имя агента (опустите для сводки по всем развёртываниям). |
| `--json` | выкл. | Выводить JSON. |

---

## Пример: развернуть, посмотреть список, осмотреть

Развернём цепочку на канале stable, убедимся, что она появилась, и прочитаем её
метрики:

```bash
# 1. Развернуть цепочку (хаб уже должен быть запущен)
maestro deploy weather-risk --channel stable
# → deployed: weather-risk  →  http://127.0.0.1:8080/agents/weather-risk  (docs: …/docs)

# 2. Посмотреть, что есть в хабе
maestro deployments
# → ● weather-risk  http://127.0.0.1:8080/agents/weather-risk  v1  runs=0

# 3. Прочитать метрики использования
maestro metrics weather-risk
```

:::note
Код выхода `2` от любой из этих команд означает, что хаб недоступен (или отклонил
развёртывание). Сначала запустите хаб — `carl-agent-hub serve` — затем повторите.
См. [Развёртывание агентов](/ru/care/workflows/deploy/).
:::

## Смотрите также

- [Развёртывание агентов](/ru/care/workflows/deploy/) — поток `/deploy` в TUI, установка, настройка и автозапуск хаба
- [Memory и Библиотека](/ru/care/cli/memory/) — найти `entity_id` цепочки для развёртывания
- [Режим Production](/ru/care/workflows/production/)
