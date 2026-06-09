---
title: Streaming
description: Render partial progress as each step finishes with stream_async.
sidebar:
  order: 2
---

`chain.stream_async(context)` is an async generator that yields each
`StepExecutionResult` **as soon as its step finishes**, then yields the terminal
`ReasoningResult` last. It lets a UI render partial progress instead of blocking
on the whole chain.

```python
from mmar_carl.models.results import StepExecutionResult, ReasoningResult

async for item in chain.stream_async(context):
    if isinstance(item, StepExecutionResult):
        print(f"step {item.step_number} done: success={item.success}")
    else:  # terminal ReasoningResult
        print(f"chain success={item.success}")
```

For a 3-step chain that takes ~24 s end-to-end, step 1's output becomes
inspectable around t≈7 s instead of at t≈24 s.

## Things to know

- **Completion order** — items are yielded as each step *finishes*, not in chain
  definition order. Parallel batches surface their steps as each one completes.
- **Callbacks still fire** — your `context.on_step_complete` runs alongside the
  stream; trace events fire in real time too.
- **Terminal result** — exactly one `ReasoningResult` is yielded last; everything
  before it is a `StepExecutionResult`.

## Token-level streaming

For streaming *within* a step (token by token), set an `on_llm_chunk` callback on
the context — see [callbacks](/carl/async/overview/#monitoring-callbacks). The two
compose: `on_llm_chunk` streams tokens inside a step; `stream_async` streams
completed steps.

## See also

- [Async execution](/carl/async/overview/) — parallelism, callbacks, timeouts.
- [Streaming example](https://github.com/Glazkoff/carl-experiments/blob/main/examples/llm_inference/openrouter_example.py) in the repo.
