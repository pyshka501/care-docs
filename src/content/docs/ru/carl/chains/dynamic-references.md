---
title: Динамические ссылки
description: Синтаксис ссылок $history / $memory / $outer_context / $steps / $metadata / $event / $ltm и литералы, которыми шаги связываются друг с другом.
sidebar:
  order: 4
---

Многие поля шагов принимают **строку-ссылку**, которую CARL разрешает по
контексту исполнения во время запуска. Так поздний шаг читает вывод раннего,
значение из памяти или вход от хоста.

## Синтаксис ссылок

| Ссылка | Во что разрешается |
| --- | --- |
| `$history[-1]` | Одна запись истории по индексу (отрицательный считается с конца). `None`, если история пуста. |
| `$history` | Вся текущая история одной строкой. |
| `$memory.namespace.key` | Значение из памяти. `$memory.key` читает пространство `default`. |
| `$outer_context` | Вход от хоста. Если задан `context.runtime_input`, то этот dict. Иначе строка `outer_context`, разобранная как JSON, если похожа на JSON (`{…}`, `[…]` или строка в кавычках). |
| `$outer_context.path.to.field` | Одно поле значения выше по пути через точки. `None`, если ключа нет. |
| `$steps.<n>.path` | Поле сохранённого результата шага `n`, например `$steps.1.result_data` или `$steps.1.result_data.city`. |
| `$metadata.path` | Значение (возможно вложенное) из `context.metadata`. `result_data` каждого завершённого шага также лежит в `$metadata.step_<n>`. |
| `$event.<name>` | Последний payload события (см. [шину событий](/ru/carl/orchestration/overview/#шина-событий)). |
| `$ltm.<key>` | Значение из долговременной памяти, если подключён LTM-бэкенд. |
| `"text"` или `'text'` | **Литерал**. Кавычки снимаются, текст берётся как есть. |
| всё остальное | Ищется как обычный ключ в `context.metadata`. Обычно `None`. |

Вложенные пути пишутся через точку, элементы списка — числовыми сегментами.

### Вход хоста: `runtime_input` и `outer_context`

Если у хоста есть структурированный вход, передавайте его отдельно от текста
промпта:

```python
context = ReasoningContext(
    outer_context="Summarise the customer's request.",   # what LLM steps read as input text
    runtime_input={"customer": {"id": 42, "city": "Oslo"}},
    api=client,
)
```

- `$outer_context` → `{"customer": {...}}`, а `$outer_context.customer.city` → `"Oslo"`.
- LLM-промпты по-прежнему берут `outer_context` (и `step_context_queries` ищут в нём).
- `runtime_input` копируется в контекст каждого шага, в том числе в
  параллельных батчах, поэтому ссылки работают внутри `chain.execute()`.
- Поддержку можно проверить по `mmar_carl.HOST_RUNTIME_INPUT_ABI` (`1`).

Без `runtime_input` положите JSON в `outer_context`, и те же ссылки сработают.

### Литералы

Литералы берите в кавычки. Значение без кавычек, которое не начинается с `$`,
ищется как ключ метаданных и обычно даёт `None`. У
[шага инструмента](/ru/carl/steps/tool/) обязательный параметр, равный `None`,
падает с `CARL_TOOL_INPUT_UNRESOLVED` ещё до вызова инструмента.

```python
input_mapping={
    "style": "'concise'",          # string literal
    "values": '"[1, 2, 3]"',       # JSON text; declare ToolParameter(type="list") to parse it
    "limit": '"10"',               # declare ToolParameter(type="int") to get 10
}
```

Шаги делегирования агентам ([Claude Code](/ru/carl/steps/claude-code/),
[Codex](/ru/carl/steps/codex/)) мягче: там значение без кавычек и без `$`
передаётся как обычный текст.

## Где используются ссылки

| Поле | У шага | Типичное значение |
| --- | --- | --- |
| `input_mapping` | Tool, agent, map, command, command plan, agent skill, handoff, supervisor, Claude Code, Codex | `{"data": "$history[-1]"}` |
| `input_mapping` | Structured output | В блок `Input:` промпта попадают только сопоставленные значения. |
| `prompt_input_mapping` | Human input | Сопоставленные значения добавляются к промпту человека как `Context (JSON):`. |
| `argument_mapping` | MCP | `{"query": "$memory.input.query"}` |
| `value_source` | Memory (write/append) | `"$history[-1]"` |
| `condition`, `condition_context_key` | Conditional | `"$history[-1]"` |
| `condition_key` | [Цикл](/ru/carl/steps/loops/) | `"$memory.loop.needs_retry"` |
| `input_source` | Structured output | `"$history[-1]"` |
| `input_key` | Transform | `"$history[-1]"` |
| `items_source` | [Map](/ru/carl/steps/map/) | `"$steps.1.result_data.rows"` |
| `task_source` | Supervisor, debate | `"$outer_context"` |
| `resume_session` | Claude Code, Codex | `"$memory.claude_code.step_1"` |
| `output_reference` | [Цепочка-инструмент](/ru/carl/steps/chain-tools/) | `"$steps.1.result_data"` (читается в дочерней цепочке) |

Некоторые поля принимают только ссылки с `$`. Например, шаги agent и map
отклоняют литералы в `input_mapping`; это сказано на их страницах.

## Пример

```python
from mmar_carl import ToolStepDescription, ToolStepConfig

ToolStepDescription(
    number=2,
    title="Summarise",
    dependencies=[1],
    config=ToolStepConfig(
        tool_name="summarise",
        input_mapping={
            "text": "$history[-1]",
            "topic": "$memory.input.topic",
            "city": "$outer_context.customer.city",
            "style": "'concise'",
        },
    ),
)
```

## Проверка до запуска

При сборке цепочки и перед запуском CARL проверяет синтаксис ссылок и
предупреждает, если шаг читает ключ `$memory.*`, который не пишет ни один
предыдущий шаг. Предупреждение срабатывает и для ключей, заранее положенных в
контекст: это подсказка, а не ошибка. Ограниченные сопоставления
(`input_mapping` у structured output, `prompt_input_mapping` у human input)
проверяются так же.
