---
title: Context Extraction
description: How CARL pulls relevant context into each step (RAG), and how to configure the search strategy.
sidebar:
  order: 1
---

Each LLM step can declare `step_context_queries`. For every query, CARL searches
your `outer_context` and injects the matching snippets into that step's prompt — so
each step sees only the context it needs. This is the RAG-like extraction at the
heart of CARL.

```python
LLMStepDescription(
    number=1,
    title="Financial analysis",
    aim="Analyze financial performance.",
    step_context_queries=["revenue growth", "profit margins", "cost efficiency"],
)
```

## Choosing a strategy

Configure search at the **chain** level with `ContextSearchConfig`:

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `strategy` | `"substring" \| "vector"` | `"substring"` | The default search strategy. |
| `substring_config` | `dict \| None` | `None` | Options for substring search. |
| `vector_config` | `dict \| None` | `None` | Options for [vector search](/carl/search/vector-search/). |
| `embedding_model` | `str \| None` | `None` | Embedding model for vector search. |

- **Substring** (default) — fast, exact keyword matching, **no extra dependencies**.
- **Vector** — semantic similarity via FAISS embeddings; see [vector search](/carl/search/vector-search/).

### Substring options

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

Or with the builder: `ChainBuilder().with_search_config(search_config)`.

## Per-query overrides

Mix plain string queries and `ContextQuery` objects in the same step to override
the strategy for individual queries:

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

| `ContextQuery` field | Type | Purpose |
| --- | --- | --- |
| `query` | `str` | The query text. |
| `search_strategy` | `"substring" \| "vector" \| None` | Override for this query. |
| `search_config` | `dict \| None` | Extra search options for this query. |

## See also

- [Vector search](/carl/search/vector-search/) — semantic similarity with FAISS.
- [LLM steps](/carl/steps/llm/) — where `step_context_queries` live.
