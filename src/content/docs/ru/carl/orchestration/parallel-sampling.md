---
title: Parallel Sampling
description: Один LLM-шаг запускается N раз параллельно, победителя выбирает голосование большинством или LLM-судья.
sidebar:
  order: 5
---

`ParallelSamplingStepDescription` параллельно запускает `n_samples` копий
шаблонного LLM-шага (`base_step`) на одном и том же контексте и выбирает одного
победителя. В историю попадает только победитель. Все успешные ответы остаются в
`result_data`.

```python
import re

from mmar_carl import (
    LLMStepDescription,
    ParallelSamplingAggregation,
    ParallelSamplingStepConfig,
    ParallelSamplingStepDescription,
    VoteNormalization,
)

def final_answer(text: str) -> str:
    match = re.search(r"Final answer:\s*(.+)", text)
    return match.group(1) if match else text

ParallelSamplingStepDescription(
    number=2,
    title="Answer with voting",
    dependencies=[1],
    base_step=LLMStepDescription(
        number=2,
        title="_sample",
        aim="Answer the question. End with 'Final answer: <number>'.",
    ),
    config=ParallelSamplingStepConfig(
        n_samples=5,
        aggregation=ParallelSamplingAggregation.MAJORITY_VOTE,
        answer_extractor=final_answer,
        vote_normalization=VoteNormalization.AGGRESSIVE,
    ),
)
```

`base_step` — обязательный `LLMStepDescription`. Все копии запускают один и тот же
шаг вместе с его `llm_config`, то есть одну модель. Чтобы сравнить разные модели,
запустите несколько LLM-шагов параллельно (см.
[пример «совета LLM»](https://github.com/Glazkoff/carl/blob/main/examples/agents/llm_council_example.py)).

## ParallelSamplingStepConfig

| Поле | По умолчанию | Смысл |
| --- | --- | --- |
| `n_samples` | `5` | Число копий, `>= 2`. |
| `aggregation` | `MAJORITY_VOTE` | Как выбирается победитель (ниже). |
| `judge_prompt` | `""` | Шаблон судьи для `BEST_OF_N` / `LLM_JUDGE`. Подстановки `{n}` и `{candidates}` (нумерованный список). Пустая строка — встроенный промпт, который просит вернуть только номер. |
| `normalize_for_vote` | `True` | Главный переключатель. При `False` ответы сравниваются побайтно, `vote_normalization` игнорируется. |
| `vote_normalization` | `VoteNormalization.BASIC` | Каноническая форма перед подсчётом: `NONE` (как есть), `BASIC` (`strip().lower()`), `AGGRESSIVE` (case-fold, схлопывание пробелов, снятие пунктуации по краям). |
| `answer_extractor` | `None` | Функция `str -> str`, применяется к каждому ответу до нормализации. Например, вытаскивает финальный ответ или число. Если она падает, берётся исходный текст. Не сериализуется. |
| `strict` | `False` | Превращает любой запасной путь агрегации в сбой шага. |

## Агрегация

| `ParallelSamplingAggregation` | Победитель |
| --- | --- |
| `MAJORITY_VOTE` (`"majority_vote"`) | Самая частая каноническая форма. Шаг возвращает исходный текст первого ответа с этой формой. При ничьей побеждает тот, кто встретился раньше. |
| `BEST_OF_N` (`"best_of_n"`) | LLM-судья отвечает номером кандидата, этот кандидат и побеждает. |
| `LLM_JUDGE` (`"llm_judge"`) | Тот же путь, что и `BEST_OF_N`. |

Судья вызывается через LLM-клиент контекста (`context.api`) с 2 повторами.
`llm_config` базового шага для судьи не используется.

## Запасные пути видны, а не скрыты

Каждый запуск пишет `result_data["aggregation_outcome"]`:

| Значение | Смысл |
| --- | --- |
| `voted` | Хотя бы два ответа совпали в выигравшей форме. |
| `vote_degenerate_fallback_first` | Все ответы разные, «голосование» вернуло первый ответ. |
| `judged` | В ответе судьи нашёлся корректный номер кандидата. |
| `judge_unparseable_fallback_first` | Судья ответил, но корректного номера нет. Возвращён первый кандидат. |
| `judge_error_fallback_vote` | Вызов судьи упал. Победителя выбрало голосование, текст ошибки лежит в `judge_error`. |

Любое значение, кроме `voted` и `judged`, даёт предупреждение (`warnings.warn` и
логгер `mmar_carl`). При `strict=True` шаг вместо этого падает, а `result_data`
всё равно содержит кандидатов и `aggregation_outcome`.

На свободном тексте обычное голосование почти всегда вырождается: два эссе редко
совпадают дословно. Задайте `answer_extractor`, чтобы голосовали ответы, а не тексты.

## Результат

`step_result.result` — исходный текст победителя. Типизированное представление:

```python
s = step_result.as_parallel_samples()
s.n_samples, s.n_successes, s.aggregation, s.candidates
s.aggregation_outcome
s.vote_distribution     # canonical form -> count, most common first
s.vote_winning_count
s.vote_total
s.vote_degenerate       # True when no two samples agreed
s.model_extra           # judge_reply, judge_selected_index, judge_error when present
```

Поля голосования заполняются при голосовании большинством и при запасном пути после
ошибки судьи. Упавшие копии отбрасываются. Если упали все, шаг падает. Расход
токенов суммируется по всем копиям. После семплирования на каждую копию уходит
внутришаговое событие `parallel_sampling.sample` в `context.on_step_event`.

## Сериализация

`to_dict()` пишет `base_step` как вложенный словарь шага (формат 11). Цепочки
формата 10 и старше загружаются с базовым шагом `__placeholder__`, его нужно
заменить. `answer_extractor` не сериализуется и после загрузки равен `None`.

## См. также

- [Debate](/ru/carl/orchestration/debate/): роли спорят друг с другом вместо независимых ответов.
- [Оценка](/ru/carl/evaluation/metrics/): проверьте, помогает ли голосование на ваших данных.
