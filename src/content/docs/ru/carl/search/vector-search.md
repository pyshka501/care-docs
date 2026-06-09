---
title: Векторный поиск
description: Семантическое извлечение контекста с помощью FAISS-эмбеддингов.
sidebar:
  order: 2
---

Векторный поиск извлекает контекст по **семантическому сходству**, а не по точным
ключевым словам — полезно, когда формулировки в `outer_context` отличаются от вашего запроса.

## Установка

Для векторного поиска нужны дополнительные зависимости (FAISS + эмбеддинги):

```bash
pip install 'mmar-carl[vector-search]'
```

Это устанавливает `faiss-cpu`, `fastembed` и `numpy`. Substring-поиск работает всегда
без этих пакетов.

## Настройка

```python
from mmar_carl import ContextSearchConfig, ReasoningChain

search_config = ContextSearchConfig(
    strategy="vector",
    embedding_model="all-MiniLM-L6-v2",   # optional; a sensible default is used otherwise
    vector_config={
        "index_type": "flat",        # "flat" (default) or "ivf" for large datasets
        "similarity_threshold": 0.7, # minimum similarity score, 0–1 (default 0.7)
        "max_results": 5,            # max snippets per query (default 5)
    },
)

chain = ReasoningChain(steps=steps, search_config=search_config)
```

| Ключ `vector_config` | По умолчанию | Назначение |
| --- | --- | --- |
| `index_type` | `"flat"` | Тип индекса FAISS; `"ivf"` масштабируется для больших корпусов. |
| `similarity_threshold` | `0.7` | Отсекать совпадения ниже этого порога. |
| `max_results` | `5` | Максимальное количество фрагментов на запрос. |

## Substring vs. vector

| | Substring | Vector |
| --- | --- | --- |
| Зависимости | нет | `faiss-cpu`, `fastembed`, `numpy` |
| Сопоставление | точные ключевые слова | семантическое сходство |
| Скорость | максимальная | медленнее (вычисляет эмбеддинги) |
| Лучше для | кодов, идентификаторов, точных терминов | перефразированных / концептуальных совпадений |

Смешивайте оба режима в одном шаге через [переопределения на уровне запроса](/ru/carl/search/overview/#переопределения-на-уровне-запроса).
