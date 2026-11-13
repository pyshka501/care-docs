---
title: Шаг Selection
description: Выбор элементов списка по оценке, выборкой, фильтром или целиком, без вызова LLM.
sidebar:
  order: 22
---

`SelectionStepDescription` (`step_type: "selection"`, появился в 0.5.0)
выбирает элементы из коллекции. LLM он не вызывает. Типичные задачи: оставить
top-k кандидатов, выбрать родителей в эволюционном цикле, отфильтровать
шорт-лист перед голосованием.

## Пример

```python
from mmar_carl import (
    Language, ReasoningChain, ReasoningContext,
    SelectionStepConfig, SelectionStepDescription,
)

chain = ReasoningChain(steps=[
    SelectionStepDescription(
        number=1,
        title="Keep the best two",
        config=SelectionStepConfig(
            source="$outer_context.candidates",
            strategy="top_k",
            count=2,
            score_key="score",
            output_key="finalists",          # → $memory.default.finalists
        ),
    ),
    SelectionStepDescription(
        number=2,
        title="Drop weak candidates",
        config=SelectionStepConfig(
            source="$outer_context.candidates",
            strategy="filter",
            predicate="item['score'] >= 0.5",
        ),
    ),
])

context = ReasoningContext(
    outer_context="Pick finalists",
    runtime_input={"candidates": [
        {"id": "a", "score": 0.4},
        {"id": "b", "score": 0.9},
        {"id": "c", "score": 0.7},
    ]},
    api=client,                    # шаги selection его не вызывают
    language=Language.ENGLISH,
)
result = chain.execute(context)
# шаг 1 → [{'id': 'b', 'score': 0.9}, {'id': 'c', 'score': 0.7}]
# шаг 2 → [{'id': 'b', 'score': 0.9}, {'id': 'c', 'score': 0.7}]
```

## SelectionStepConfig

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `source` | `str` | `"$history[-1]"` | [Ссылка](/ru/carl/chains/dynamic-references/) на коллекцию. Список или кортеж берётся как есть, `None` превращается в `[]`, любое другое значение в список из одного элемента. |
| `strategy` | `str` | `"top_k"` | `top_k`, `bottom_k`, `weighted`, `random`, `filter` или `all`. |
| `count` | `int` | `1` | Сколько элементов взять (≥ 1). `filter` и `all` его не учитывают. |
| `score_key` | `str \| None` | `None` | Ключ словаря с оценкой элемента для `top_k` / `bottom_k` / `weighted`. При `None` оценкой считается сам элемент. Отсутствующая или нечисловая оценка считается `0.0`. |
| `predicate` | `str \| None` | `None` | Для `filter`: выражение `simpleeval` над `item` (синоним `x`). Остаются элементы, где оно истинно; выражение с ошибкой выбрасывает элемент. |
| `seed` | `int \| None` | `None` | Зерно ГСЧ для `weighted` и `random`. Задайте его для воспроизводимых запусков. |
| `output_key` | `str \| None` | `None` | Дополнительно записать выбор в память под этим ключом. |
| `namespace` | `str` | `"default"` | Пространство памяти для `output_key`. |

## Стратегии

| Стратегия | Что берёт |
| --- | --- |
| `top_k` | `count` элементов с наибольшей оценкой. |
| `bottom_k` | `count` элементов с наименьшей оценкой. |
| `weighted` | `count` элементов без возвращения, с вероятностью, пропорциональной оценке (отрицательные считаются 0; если все веса нулевые, выбор равномерный). |
| `random` | `count` элементов равномерно, без возвращения. |
| `filter` | Все элементы, где выполняется `predicate`. Без предиката все. |
| `all` | Всю коллекцию. |

## Результат

- `result_data` содержит выбор. При `count=1` стратегии с оценкой и `random`
  возвращают **один элемент**, а не список из одного. `filter`, `all` и
  `count > 1` возвращают список. Пустой источник даёт `None` для одиночного
  выбора и `[]` в остальных случаях.
- `result` содержит то же значение текстом (JSON для нестроковых значений).
- Запись истории помечена `[SELECTION: <strategy>]`.

Дальше выбор читается через `$steps.N.result_data`, а с `output_key` ещё и
через `$memory.<namespace>.<key>`.

## См. также

- [Шаг transform](/ru/carl/steps/transform/): перестроить данные без вызова LLM.
- [Параллельный сэмплинг](/ru/carl/orchestration/parallel-sampling/): выбрать из N ответов модели голосованием или судьёй.
- [Эволюция](/ru/carl/evolution/overview/).
