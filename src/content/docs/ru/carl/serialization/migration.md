---
title: Миграция — Legacy → типизированные шаги
description: Переход с единого StepDescription на типизированные классы шагов.
sidebar:
  order: 2
---

Legacy-класс `StepDescription` всё ещё работает, но новый код должен использовать
[типизированные классы шагов](/ru/carl/steps/overview/) — они дают проверку типов,
ясность намерения и первыми получают новые возможности.

## Конвертация на месте

У каждого legacy `StepDescription` есть `to_typed_step()`:

```python
legacy = StepDescription(number=1, title="Old", aim="Old step")
typed = legacy.to_typed_step()      # → LLMStepDescription
```

Загрузка тоже конвертирует за вас: `ReasoningChain.from_dict(data, use_typed_steps=True)`
(или `from_dict_typed(data)`) восстанавливает типизированные классы.

## Вручную

| Legacy | Типизированный |
| --- | --- |
| `StepDescription(..., step_type=StepType.LLM)` | `LLMStepDescription(...)` (без `step_type`). |
| `StepDescription(..., step_type=StepType.TOOL, step_config=ToolStepConfig(...))` | `ToolStepDescription(config=ToolStepConfig(...))`. |
| `StepDescription(..., step_type=StepType.MEMORY, step_config=MemoryStepConfig(...))` | `MemoryStepDescription(config=MemoryStepConfig(...))`. |

```python
# Было
StepDescription(number=1, title="Analysis", aim="Analyze data",
                reasoning_questions="What patterns exist?", step_type=StepType.LLM)

# Стало
LLMStepDescription(number=1, title="Analysis", aim="Analyze data",
                   reasoning_questions="What patterns exist?")
```

## Зачем мигрировать

- **Типобезопасность** — автодополнение в IDE + проверка типов.
- **Ясность намерения** — имя класса *и есть* тип шага.
- **Лучше валидация** — понятнее ошибки при отсутствующих полях.
- **На будущее** — новые фичи в первую очередь появляются в типизированных классах.

## Смотрите также

- [Обзор шагов](/ru/carl/steps/overview/) — типизированные классы.
- [JSON-сериализация](/ru/carl/serialization/json/)
