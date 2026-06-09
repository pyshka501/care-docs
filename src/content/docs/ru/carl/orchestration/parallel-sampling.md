---
title: Parallel Sampling
description: Семплирование N ответов параллельно и голосование или выбор лучшего (совет LLM).
sidebar:
  order: 5
---

`ParallelSamplingStepDescription` запускает одно и то же рассуждение **N раз** и агрегирует
кандидатов — большинством голосов или LLM-судьёй. Это паттерн «совета LLM».

```python
from mmar_carl import (
    ParallelSamplingStepDescription, ParallelSamplingStepConfig, ParallelSamplingAggregation,
)

ParallelSamplingStepDescription(
    number=1,
    title="Sample answers",
    aim="Answer the question.",
    config=ParallelSamplingStepConfig(
        n_samples=5,
        aggregation=ParallelSamplingAggregation.MAJORITY_VOTE,
    ),
)
```

## ParallelSamplingStepConfig

| Поле | По умолчанию | Назначение |
| --- | --- | --- |
| `n_samples` | — | Сколько кандидатов семплировать. |
| `aggregation` | — | Как выбрать победителя (ниже). |
| `judge_prompt` | `""` | Промпт для судьи `best_of_n` / `llm_judge`. |
| `normalize_for_vote` | — | Нормализовать текст перед сравнением большинства. |

### Стратегии агрегации

| `ParallelSamplingAggregation` | Выбирает победителя по… |
| --- | --- |
| `MAJORITY_VOTE` | наиболее распространённому ответу (точное / нормализованное совпадение). |
| `BEST_OF_N` | выбору LLM-судьи лучшего кандидата. |
| `LLM_JUDGE` | псевдоним для `best_of_n` с явным `judge_prompt`. |

:::tip
Запустите совет с разными моделями, комбинируя семплирование с `llm_config` на уровне шага —
см. [пример совета LLM](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/llm_council_example.py).
:::

## Смотрите также

- [Debate](/ru/carl/orchestration/debate/) — структурированная дискуссия вместо независимых семплов.
