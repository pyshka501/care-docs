---
title: LLM Step
description: Chain-of-thought reasoning steps, the default CARL step type.
sidebar:
  order: 2
---

`LLMStepDescription` is the default step type: a chain-of-thought reasoning step
backed by one LLM call (or a few, in `SELF_CRITIC` mode).

## Fields

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `aim` | `str` | `""` (**required, non-empty**) | The primary objective of the step. |
| `reasoning_questions` | `str` | `""` | Key questions the step should answer. |
| `stage_action` | `str` | `""` | The specific action to perform. |
| `example_reasoning` | `str` | `""` | An example of the expert reasoning you want. |
| `step_context_queries` | `list[ContextQuery \| str]` | `[]` | RAG-like queries that pull relevant context from `outer_context` into this step's prompt. |
| `llm_config` | `LLMStepConfig \| None` | `None` | Per-step model / temperature / mode override. |
| `retry_max` | `int \| None` | `None` | Retry attempts for the provider call (`None` = `context.retry_max`). |
| `timeout` | `float \| None` | `None` | Step timeout in seconds, > 0 (`None` = the chain's `timeout`, if any). |

Plus the fields every step shares (`number`, `title`, `dependencies`, `cache`,
`loop_back_to`, …), see the [step overview](/carl/steps/overview/).

:::tip
`aim`, `reasoning_questions`, `stage_action`, and `example_reasoning` accept a
**list** as well as a string. A list is coerced to a `"- item\n- item"` block,
which keeps chains produced by an LLM planner loadable.
:::

## Basic example

```python
from mmar_carl import LLMStepDescription

LLMStepDescription(
    number=1,
    title="Assess data quality",
    aim="Assess the quality and completeness of the input data.",
    reasoning_questions="What data patterns and anomalies are present?",
    step_context_queries=["missing values", "data consistency"],
    stage_action="Evaluate reliability and flag issues.",
    example_reasoning="High-quality data enables reliable downstream analysis.",
)
```

## Per-step LLM config

Override the model, temperature, or execution mode for one step with
`LLMStepConfig`:

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `model` | `str \| None` | `None` | Model id (e.g. `anthropic/claude-3.5-sonnet`). |
| `temperature` | `float \| None` | `None` | 0.0–2.0. |
| `max_tokens` | `int \| None` | `None` | Output cap. |
| `timeout` | `float \| None` | `None` | Declared but not applied by the executor. Use the step's own `timeout`. |
| `token_budget_warning` | `int \| None` | `None` | Warn when the step's total tokens reach this many (> 0). |
| `execution_mode` | `ExecutionMode` | `FAST` | `FAST` or `SELF_CRITIC`. |
| `self_critic_evaluators` | `list[str]` | `["llm"]` | Evaluator names for `SELF_CRITIC`; all must approve. |
| `self_critic_max_revisions` | `int` | `1` | Max regeneration rounds (≥ 0). |
| `self_critic_instruction` | `str` | `""` | Extra instruction for the built-in `"llm"` evaluator. |
| `self_critic_disapprove_feedback` | `dict[str, str]` | `{}` | Static feedback added to the regeneration notes when an evaluator disapproves. Key = evaluator name, `"*"` = any. |
| `use_message_history` | `bool` | `False` | Send structured multi-turn messages instead of a flat prompt. |

```python
from mmar_carl import LLMStepDescription, LLMStepConfig

LLMStepDescription(
    number=2,
    title="Deep analysis",
    aim="Perform a rigorous analysis.",
    llm_config=LLMStepConfig(model="anthropic/claude-3.5-sonnet", temperature=0.2),
)
```

How the client is chosen (`context.get_llm_client_for_step`):

1. The step's `llm_config`, with unset `model` / `temperature` / `max_tokens`
   filled from the chain's `default_llm_config`
   (`ReasoningChain(default_llm_config=...)`).
2. The chain's `default_llm_config` alone.
3. The context's default client.

:::caution
`model`, `temperature`, and `max_tokens` overrides only take effect when the
context's client is an `OpenAICompatibleClient`: CARL builds a derived client
with the overridden settings and caches it. With any other client the step
silently runs on the default client.
:::

Two more fields worth calling out:

- **`token_budget_warning`** emits a Python `warnings.warn` when the step's total
  tokens reach the threshold. It only fires with a client that reports usage
  (e.g. `OpenAICompatibleClient`). See [cost tracking](/carl/tracing/cost/).
- **`use_message_history`** sends a structured `system`/`user`/`assistant`
  message list instead of a flat prompt. The system prompt and outer context
  become the first `system` message, prior turns from `context.messages` are
  included, and the reply is appended back to `context.messages`. It needs a
  client that implements `get_response_with_messages` (e.g.
  `OpenAICompatibleClient`). This path takes precedence over `execution_mode`:
  a step with `use_message_history=True` makes one call and no self-critique.

## What the step records

On success, `StepExecutionResult` carries:

- `result`: the model's answer; the history entry is `Step N. Title` plus
  `Result: ...`.
- `token_usage`: `{"prompt", "completion", "total"}` when the client reports
  usage, otherwise `{}`.
- `model`: the client's `model_name`, when it has one.
- `prompt`: the fully rendered prompt, only when `context.trace_prompts=True`
  (off by default, because the prompt embeds outer context and history).

A failed step records `error_message`; it does not record token usage.

## Execution modes

- **`FAST`** (default): one LLM pass.
- **`SELF_CRITIC`**: the step generates an answer, runs it past the evaluators in
  `self_critic_evaluators`, and regenerates with their reviews up to
  `self_critic_max_revisions` times until all of them approve. If the budget runs
  out without approval, the step still succeeds with the last candidate and
  records a `quality_warning`.

```python
from mmar_carl import ExecutionMode, LLMStepConfig

LLMStepConfig(
    execution_mode=ExecutionMode.SELF_CRITIC,
    self_critic_evaluators=["llm"],
    self_critic_max_revisions=2,
    self_critic_instruction="Reject answers that aren't backed by the data.",
)
```

`"llm"` is the built-in LLM reviewer. Register your own (non-LLM or custom)
evaluator with `context.register_self_critic_evaluator(name, evaluator)`:
subclass `SelfCriticEvaluatorBase`, implement `async evaluate(...)`, and return a
`SelfCriticDecision(verdict=..., review_text=...)`. Any verdict other than
`"APPROVE"` counts as disapproval. An evaluator name that is not registered fails
the step.

### Example

The repo's [execution-modes example](https://github.com/Glazkoff/carl/blob/main/examples/orchestration/execution_modes_mock_example.py)
(mock client, no API key) runs a 3-step chain: a `FAST` pass, a `SELF_CRITIC` step
with the default `"llm"` evaluator, and a `SELF_CRITIC` step whose evaluator chain
adds a custom keyword guard.

```python
from mmar_carl import (
    ExecutionMode, LLMStepConfig, SelfCriticDecision, SelfCriticEvaluatorBase,
)

class KeywordGuardEvaluator(SelfCriticEvaluatorBase):
    def __init__(self, required_keyword: str):
        self.required_keyword = required_keyword.lower()

    async def evaluate(self, step, candidate, base_prompt, context, llm_client, retries):
        if self.required_keyword in candidate.lower():
            return SelfCriticDecision(verdict="APPROVE", review_text="found")
        return SelfCriticDecision(verdict="DISAPPROVE", review_text="missing keyword")

context.register_self_critic_evaluator("keyword_guard", KeywordGuardEvaluator("mitigation"))

LLMStepConfig(
    execution_mode=ExecutionMode.SELF_CRITIC,
    self_critic_evaluators=["llm", "keyword_guard"],  # both must approve
    self_critic_max_revisions=2,
)
```

Per-step mode telemetry lands in `context.metadata["execution_mode_details"][str(step_number)]`:
`execution_mode`, `llm_calls`, and for `SELF_CRITIC` also `rounds`,
`max_revisions`, `evaluator_decisions`, and `quality_warning` when the budget ran
out.

## Known limitations

- A legacy `StepDescription` converted with `to_typed_step()` keeps `llm_config`
  but drops `retry_max` and `timeout`. Build `LLMStepDescription` directly if you
  need them.

## See also

- [Dynamic references](/carl/chains/dynamic-references/) for wiring step outputs together.
- [Context extraction](/carl/concepts/what-is-carl/) for how `step_context_queries` work.
- [LLM clients](/carl/llm/clients/) and the [token usage example](https://github.com/Glazkoff/carl/blob/main/examples/llm_inference/token_usage_example.py).
