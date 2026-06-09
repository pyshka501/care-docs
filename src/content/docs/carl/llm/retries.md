---
title: Retries
description: Status-aware retry policy with bounded backoff and jitter.
sidebar:
  order: 2
---

By default, the retry methods retry **every** exception up to 3 times with
`2 ** attempt` backoff — which means a fast-failing 401 (bad API key) wastes 7+
seconds before surfacing. A `RetryPolicy` fixes that: retry only transient errors,
with bounded backoff and jitter.

```python
from mmar_carl import OpenAICompatibleClient, OpenAIClientConfig, RetryPolicy

client = OpenAICompatibleClient(OpenAIClientConfig(
    base_url="https://openrouter.ai/api/v1",
    api_key="sk-or-v1-...",
    model="qwen/qwen3-coder",
    retry_policy=RetryPolicy(
        max_attempts=5,
        backoff="exponential",
        initial_delay_s=0.5,
        max_delay_s=10.0,
    ),
))
```

## Fields

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `max_attempts` | `int` | `3` | Total attempts (initial + retries); 1–20. |
| `retry_on_status` | `list[int]` | `[429, 500, 502, 503, 504]` | Which HTTP statuses warrant a retry. |
| `backoff` | `"constant" \| "exponential"` | `"exponential"` | Delay growth between attempts. |
| `initial_delay_s` | `float` | `1.0` | Delay before the first retry. |
| `max_delay_s` | `float` | `30.0` | Cap on any single delay. |
| `jitter` | `bool` | `True` | Multiply each delay by `0.5 + random()*0.5` to avoid thundering herds. |

:::caution
**401, 403, 404, 422 are intentionally not retried** — auth/validation errors are
permanent, so retrying just wastes budget. They abort immediately.
:::

The policy wires through `OpenAIClientConfig.retry_policy` and governs the
retry-aware methods (`get_response_with_retries`, `get_response_with_usage`, …).

## See also

- [LLM clients](/carl/llm/clients/) · [Record & replay](/carl/llm/record-replay/)
