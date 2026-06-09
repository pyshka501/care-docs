---
title: Трассировка и наблюдаемость
description: Трасса выполнения, диаграммы Ганта, HTML-воспроизведение, агрегация и Langfuse.
sidebar:
  order: 1
---

Каждый запуск автоматически строит структурированный `ExecutionTrace`,
прикреплённый к `result.trace`. Он сериализуемый, сравниваемый и воспроизводимый.

```python
result = chain.execute(context)
trace = result.trace
```

## Диаграмма Ганта и HTML-воспроизведение

```python
print(trace.format_gantt())              # text Gantt (parallel-batch aware)
print(trace.format_gantt(format="mermaid"))

trace.to_html("playback.html")           # standalone animated HTML/JS (zero deps)
```

`to_html()` записывает самодостаточный файл (встроенный CSS+JS), который можно
добавить в описание PR; без пути возвращает HTML-строку.

## Сохранение и сравнение

```python
trace.to_json()                          # serialise (also: from_json)
diff = trace.diff(other_trace)           # structural diff between two runs
```

## Агрегация по нескольким запускам

`TraceAggregator` сворачивает множество трасс — перцентили задержек по шагам
(`p50/p95/p99/mean/max`) и использование токенов (`p50/p95`) — для обнаружения
выбросов хвостовой задержки после пакетного запуска:

```python
from mmar_carl import TraceAggregator

agg = TraceAggregator([t1, t2, t3])
```

## Langfuse

Для хостинговой панели трассировки установите `LANGFUSE_PUBLIC_KEY` (и секрет) в
переменные окружения — интеграция `tracing.py` от CARL автоматически отправляет спаны
(установите `mmar-carl[langfuse]`).

## Логирование

```python
import logging
from mmar_carl import set_log_level, get_logger

set_log_level(logging.DEBUG)   # INFO by default
get_logger().info("Starting analysis")
```

| Уровень | Когда |
| --- | --- |
| `DEBUG` | Разработка — подробный поток. |
| `INFO` | Продакшн — старт/завершение цепочки (по умолчанию). |
| `WARNING` | Неудачные шаги. |
| `ERROR` | Критические ошибки. |

## Смотрите также

- [Визуализация](/ru/carl/tracing/visualization/) — пироги токенов, тепловые карты, Mermaid.
- [Оценка стоимости](/ru/carl/tracing/cost/) — предварительный расчёт расходов.
