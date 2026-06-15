---
title: Метрики
description: Оценка выводов шагов и цепочек встроенными или пользовательскими метриками.
sidebar:
  order: 1
---

**Метрика** преобразует вывод шага или цепочки в числовой показатель. Прикрепите метрики
к шагам или к цепочке; оценки попадают в результат выполнения (и питают
[рефлексию](/ru/carl/evaluation/reflection/) и [датасетную оценку](/ru/carl/evaluation/datasets/)).

## Прикрепление метрик

```python
LLMStepDescription(number=1, title="Summarise", aim="Summarise the text.",
                   metrics=[WordCountMetric()])           # step-level

chain = ReasoningChain(steps=steps, metrics=[CoverageMetric()])  # chain-level
```

Метрика шага получает `StepExecutionResult`; метрика цепочки получает `ReasoningResult`.

## Встроенные метрики сопоставления

Для проверок точного/ожидаемого вывода CARL поставляет готовые метрики (отлично подходят
для [датасетов](/ru/carl/evaluation/datasets/) и `EvalSuite`):

```python
from mmar_carl import (
    ExactMatchMetric, CaseInsensitiveMatchMetric, ContainsMetric, RegexMatchMetric,
)
```

| Метрика | Проходит, когда вывод… |
| --- | --- |
| `ExactMatchMetric` | совпадает с ожидаемым значением. |
| `CaseInsensitiveMatchMetric` | совпадает без учёта регистра. |
| `ContainsMetric` | содержит ожидаемую подстроку. |
| `RegexMatchMetric` | соответствует ожидаемому регулярному выражению. |

## Пользовательские метрики

Создайте подкласс `MetricBase` — реализуйте свойство `name` и async-метод `compute_async`,
возвращающий float. Оценка может быть чем угодно (количество слов, рейтинг LLM-судьи,
сходство…):

```python
from mmar_carl import MetricBase
from mmar_carl.models.results import ReasoningResult

class WordCountMetric(MetricBase):
    @property
    def name(self) -> str:
        return "word_count"

    async def compute_async(self, output) -> float:
        text = output.get_final_output() if isinstance(output, ReasoningResult) else output.result
        return float(len(text.split()))
```

:::note
`WordCountMetric` и метрика LLM-судьи показаны в [примере метрик](https://github.com/Glazkoff/carl-experiments/blob/main/examples/evaluation/metrics_example.py)
в репозитории — это пользовательские метрики, не импорты из библиотеки.
:::

## Пример

[Пример метрик](https://github.com/Glazkoff/carl-experiments/blob/main/examples/evaluation/metrics_example.py)
из репозитория работает с mock-клиентом LLM (без API-ключа) и определяет четыре
пользовательские метрики — `WordCountMetric`, `SentenceLengthMetric`,
`KeywordCoverageMetric` и `MockLLMJudgeMetric` (асинхронную заглушку с I/O-формой
для подхода LLM-as-a-judge). Он прикрепляет их на обоих уровнях и считывает оценки
обратно из результата.

```python
steps = [
    LLMStepDescription(
        number=1, title="Data Overview", aim="Summarise the dataset",
        metrics=[WordCountMetric(), SentenceLengthMetric()],
    ),
    LLMStepDescription(
        number=2, title="Trend Analysis", aim="Identify revenue trends",
        dependencies=[1],
        metrics=[KeywordCoverageMetric(["growth", "revenue"]), MockLLMJudgeMetric()],
    ),
]

# Chain-level metrics run on the final step's output.
chain = ReasoningChain(steps=steps, metrics=[KeywordCoverageMetric(["recommend"])])
result = await chain.execute_async(context)

for sr in result.step_results:
    print(sr.step_number, sr.metrics)   # per-step scores → StepExecutionResult.metrics
print(result.metrics)                   # chain-level scores → ReasoningResult.metrics
```

Оценки по шагам попадают в `StepExecutionResult.metrics`; оценки на уровне цепочки —
в `ReasoningResult.metrics`. Метрика, выбросившая исключение, никогда не прерывает
выполнение — её оценка просто опускается.

### Метрики с учётом кейса

При оценке [датасета](/ru/carl/evaluation/datasets/) метрика может получать «правильный ответ»
на каждый кейс, объявив параметр `case` — `call_metric_async` от CARL передаёт текущий `DataCase`:

```python
async def compute_async(self, output, *, case=None) -> float:
    expected = case.expected if case else ""
    return 1.0 if output.get_final_output().strip() == expected else 0.0
```

## Смотрите также

- [Датасеты и оценка](/ru/carl/evaluation/datasets/)
- [Рефлексия](/ru/carl/evaluation/reflection/)
