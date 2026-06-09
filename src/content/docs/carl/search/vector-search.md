---
title: Vector Search
description: Semantic context extraction with FAISS embeddings.
sidebar:
  order: 2
---

Vector search retrieves context by **semantic similarity** rather than exact
keywords — useful when the wording in `outer_context` differs from your query.

## Install

Vector search needs optional dependencies (FAISS + embeddings):

```bash
pip install 'mmar-carl[vector-search]'
```

This pulls in `faiss-cpu`, `fastembed`, and `numpy`. Substring search always works
without these.

## Configure

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

| `vector_config` key | Default | Purpose |
| --- | --- | --- |
| `index_type` | `"flat"` | FAISS index type; `"ivf"` scales to large corpora. |
| `similarity_threshold` | `0.7` | Drop matches below this score. |
| `max_results` | `5` | Max snippets returned per query. |

## Substring vs vector

| | Substring | Vector |
| --- | --- | --- |
| Dependencies | none | `faiss-cpu`, `fastembed`, `numpy` |
| Matching | exact keywords | semantic similarity |
| Speed | fastest | slower (embeds text) |
| Best for | codes, IDs, exact terms | paraphrased / conceptual matches |

Mix both in one step with [per-query overrides](/carl/search/overview/#per-query-overrides).
