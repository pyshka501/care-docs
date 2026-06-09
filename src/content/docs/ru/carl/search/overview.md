---
title: Извлечение контекста
description: Как CARL извлекает нужный контекст в каждый шаг (RAG) и как настроить стратегию поиска.
sidebar:
  order: 1
---

Каждый LLM-шаг может объявить `step_context_queries`. По каждому запросу CARL ищет
в вашем `outer_context` и вставляет найденные фрагменты в промпт этого шага — так
каждый шаг видит только тот контекст, который ему нужен. Это RAG-подобное извлечение,
лежащее в основе CARL.

```python
LLMStepDescription(
    number=1,
    title="Financial analysis",
    aim="Analyze financial performance.",
    step_context_queries=["revenue growth", "profit margins", "cost efficiency"],
)
```

## Выбор стратегии

Настройте поиск на уровне **цепочки** с помощью `ContextSearchConfig`:

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `strategy` | `"substring" \| "vector"` | `"substring"` | Стратегия поиска по умолчанию. |
| `substring_config` | `dict \| None` | `None` | Параметры substring-поиска. |
| `vector_config` | `dict \| None` | `None` | Параметры [векторного поиска](/ru/carl/search/vector-search/). |
| `embedding_model` | `str \| None` | `None` | Модель эмбеддингов для векторного поиска. |

- **Substring** (по умолчанию) — быстрое точное сопоставление по ключевым словам, **без дополнительных зависимостей**.
- **Vector** — семантическое сходство через FAISS-эмбеддинги; см. [векторный поиск](/ru/carl/search/vector-search/).

### Параметры substring

```python
from mmar_carl import ContextSearchConfig, ReasoningChain

search_config = ContextSearchConfig(
    strategy="substring",
    substring_config={
        "case_sensitive": False,      # default
        "min_word_length": 2,         # default
        "max_matches_per_query": 3,   # default
    },
)

chain = ReasoningChain(steps=steps, search_config=search_config)
```

Или через построитель: `ChainBuilder().with_search_config(search_config)`.

## Переопределения на уровне запроса

Смешивайте обычные строки-запросы и объекты `ContextQuery` в одном шаге для
переопределения стратегии у отдельных запросов:

```python
from mmar_carl import ContextQuery

step_context_queries=[
    "EBITDA",                                    # uses the chain default
    ContextQuery(
        query="revenue trends",
        search_strategy="vector",
        search_config={"similarity_threshold": 0.8, "max_results": 3},
    ),
    ContextQuery(
        query="NET_INCOME",
        search_strategy="substring",
        search_config={"case_sensitive": True},
    ),
]
```

| Поле `ContextQuery` | Тип | Назначение |
| --- | --- | --- |
| `query` | `str` | Текст запроса. |
| `search_strategy` | `"substring" \| "vector" \| None` | Переопределение для этого запроса. |
| `search_config` | `dict \| None` | Дополнительные параметры поиска для этого запроса. |

## Смотрите также

- [Векторный поиск](/ru/carl/search/vector-search/) — семантическое сходство через FAISS.
- [LLM-шаги](/ru/carl/steps/llm/) — где находится `step_context_queries`.
