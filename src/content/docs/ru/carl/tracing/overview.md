---
title: Трассировка и наблюдаемость
description: ExecutionTrace как запись по шагам и агентам — входы, модель, промпт, измеренное время, вложенные трассы — а также Гант, HTML-проигрыватель, агрегация, Langfuse и логирование.
sidebar:
  order: 1
---

Каждый прогон строит `ExecutionTrace` и кладёт его в `result.trace`. Трасса
записывает, что получил каждый шаг, какая модель его обслужила, когда он
реально работал, а для делегирующих шагов ещё и трассу вложенной цепочки.
Трассу можно сериализовать, сравнить и отрисовать.

## Что записывает одно событие

`trace.events` содержит по одному `TraceEvent` на шаг:

| Поле | Содержимое |
| --- | --- |
| `step_number`, `step_title`, `step_type` | Идентичность. |
| `success`, `skipped`, `error_message` | Исход. |
| `result`, `result_data` | Вывод (текст обрезается на 10 000 символах). |
| `execution_time`, `token_usage`, `batch_index` | Стоимость и планирование. |
| `inputs` | `input_mapping` шага, разрешённый прямо перед запуском его батча. Значения приводятся к JSON и обрезаются до 2 000 символов. Неразрешимые ссылки дают `None`. Шаги без `input_mapping` пишут `{}`. |
| `model` | Модель, которая обслужила шаг (`None` для шагов без LLM). |
| `prompt` | Собранный промпт, обрезанный до 10 000 символов. **Только по явному включению**: `ReasoningContext(trace_prompts=True)`. |
| `started_at`, `ended_at` | Измеренные отметки времени ISO-8601 в UTC. |
| `sub_trace` | Полная `ExecutionTrace` вложенной цепочки для шагов handoff и supervisor. |

Промпт содержит внешний контекст, историю и прочитанную память. Поэтому по
умолчанию он не записывается. Шаг ввода человека с `sensitive=True` не пишет
ни промпт, ни входы, а ключ памяти, который он записал, во входах следующих
шагов виден как `"[redacted]"`. Это не зависит от `trace_prompts`.

Пример работает офлайн с клиентом-заглушкой:

```python
import asyncio
from mmar_carl import (
    LLMClientBase, LLMStepDescription, ToolStepDescription, ToolStepConfig,
    ReasoningChain, ReasoningContext,
)

class StubLLM(LLMClientBase):
    @property
    def model_name(self): return "stub-model"
    async def get_response(self, prompt): return "Paris"
    async def get_response_with_retries(self, prompt, retries=3): return "Paris"

def lookup_weather(city: str) -> str:
    return f"sunny in {city}"

chain = ReasoningChain(steps=[
    LLMStepDescription(number=1, title="Pick city", aim="Name one city."),
    ToolStepDescription(number=2, title="Weather", dependencies=[1],
        config=ToolStepConfig(tool_name="lookup_weather",
                              input_mapping={"city": "$steps.1.result"})),
])

async def main():
    ctx = ReasoningContext(outer_context="Trip planning", api=StubLLM(), trace_prompts=True)
    ctx.register_tool("lookup_weather", lookup_weather)
    result = await chain.execute_async(ctx)
    for ev in result.trace.events:
        print(ev.step_number, ev.model, ev.inputs, ev.started_at, bool(ev.prompt))
    # 1 stub-model {} 2026-...+00:00 True
    # 2 None {'city': 'Paris'} 2026-...+00:00 False

asyncio.run(main())
```


## Гант и HTML-проигрыватель

```python
print(trace.format_gantt())                   # текстовый Гант
print(trace.format_gantt(format="mermaid"))
trace.to_html("playback.html")                # самодостаточный анимированный HTML без зависимостей
```

Гант берёт измеренные `started_at` / `ended_at`, если они есть у всех
событий. Иначе (старые или собранные вручную трассы) он строится по батчам.
`to_html()` показывает ещё модель, время, промпт и панель вложенных трасс. Без
пути возвращает строку HTML.

## Сохранение и сравнение

```python
s = trace.to_json()
same = ExecutionTrace.from_json(s)            # также from_dict / TraceEvent.from_dict
diff = trace.diff(other_trace)                # dict со структурными различиями
```

JSON трасс, записанный до появления новых полей, загружается. Недостающие поля
получают значения по умолчанию. Помощники: `get_event(n)`,
`get_failed_events()`, `get_skipped_events()`, `get_successful_events()`,
`total_tokens()`.

## Агрегация по прогонам

`TraceAggregator` сводит много трасс в перцентили задержки по шагам (`p50`,
`p95`, `p99`, `mean`, `max` в мс) и перцентили токенов:

```python
from mmar_carl import TraceAggregator

agg = TraceAggregator([t1, t2, t3])
print(agg.format_text())
agg.latency_ms[1]   # {"p50": ..., "p95": ..., ...} для шага 1
agg.tokens[1]
```

## Langfuse

Установите `mmar-carl[langfuse]` и задайте `ENABLE_LANGFUSE=True`,
`LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY` и при необходимости
`LANGFUSE_HOST` (по умолчанию `https://cloud.langfuse.com`). Тогда спаны
отправляются автоматически. Экспортированы `is_langfuse_enabled()` и
`langfuse_flush()`.

## Логирование

```python
import logging
from mmar_carl import set_log_level, get_logger

set_log_level(logging.DEBUG)   # по умолчанию INFO
get_logger().info("Starting analysis")
```

## См. также

- [Визуализация](/ru/carl/tracing/visualization/) — пироги токенов, тепловые карты, Mermaid.
- [Оценка стоимости](/ru/carl/tracing/cost/) — прогноз расходов без запуска.
- [Эволюция](/ru/carl/evolution/overview/) — `model` в трассе привязывает результаты `MODEL_SWAP`.
