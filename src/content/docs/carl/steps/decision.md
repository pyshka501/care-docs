---
title: Decision Step
description: Ask a decision model typed questions (predicate, choice, score) about one state and route the chain on the answers.
sidebar:
  order: 24
---

`DecisionStepDescription` (`step_type: "decision"`, new in 0.5.1) asks a
**decision model** typed questions about one state and gets typed answers
back, not text. Decision models do not generate tokens. They read the whole
state and pick an answer from the space you define: a probability, one of
your options, or a position on a rubric.

The step is one HTTP request to the provider. It does not use the chain's
LLM client.

## Providers

| `provider` | Endpoint | Model examples |
| --- | --- | --- |
| `openai` (default) | `POST https://api.openai.com/v1/decisions` | `gpt-6-luna` |
| `azure_openai` | `POST {base_url}/decisions`, `api-key` header; `base_url` is required | your deployment name |
| `openrouter` | `POST https://openrouter.ai/api/alpha/decisions` | `typesafe/jev-1.14`, `openai/gpt-6-luna-decisions` |

OpenRouter marks its Decisions API as alpha. All three adapters return the
same answer shape in `result_data["answers"]`. In the 0.5.1 release, live
checks ran on OpenRouter; the direct OpenAI and Azure adapters have offline
tests only.

## Question types

| `type` | You give | Decided `value` |
| --- | --- | --- |
| `predicate` | `instructions`, `threshold` (default `0.5`) | `True` when the probability ≥ `threshold` |
| `choice` | `choices`: 2–255 `DecisionChoice(value, description)` | one of the choice values |
| `score` | `levels`: 2–10 `DecisionLevel(label, description)`, lowest first | probability-weighted level index (`float`) |

`noul` is accepted as an alias for `predicate` when a chain is loaded. Images
are not supported: the state is text or JSON.

## Example

```python
from mmar_carl import (
    ConditionalBranch, ConditionalStepConfig, ConditionalStepDescription,
    DecisionChoice, DecisionQuestion, DecisionStepConfig, DecisionStepDescription,
    ReasoningContext,
)

triage = DecisionStepDescription(
    number=1,
    title="Triage ticket",
    config=DecisionStepConfig(
        provider="openrouter",
        model="typesafe/jev-1.14",          # pin a version, see Thresholds
        state_source="$outer_context",
        questions=[
            DecisionQuestion(
                name="department",
                type="choice",
                instructions="Which department should handle this ticket?",
                choices=[
                    DecisionChoice(value="billing", description="Payments and refunds."),
                    DecisionChoice(value="other", description="Everything else."),
                ],
                min_confidence=0.7,
                fallback="other",
            ),
            DecisionQuestion(
                name="urgent",
                type="predicate",
                instructions="Is the customer blocked right now?",
                threshold=0.8,
            ),
        ],
        output_memory_key="ticket",         # → $memory.decision.ticket
    ),
)

route = ConditionalStepDescription(
    number=2,
    title="Route",
    dependencies=[1],
    config=ConditionalStepConfig(
        condition_context_key="$memory.decision.ticket",
        branches=[ConditionalBranch(condition="value['department'] == 'billing'", next_step=3)],
        default_step=4,
    ),
)

context = ReasoningContext(
    outer_context=ticket_text,
    api=client,
    decision_endpoints={
        "openrouter": ("https://openrouter.ai/api/alpha/decisions", "OPENROUTER_API_KEY"),
    },
)
```

Steps 3 and 4 are the two handlers. The memory value is
`{"department": "billing", "urgent": True}`, one decided value per question.

## Host grant and credentials

The host must authorize each provider in
`ReasoningContext.decision_endpoints`: provider → `(request URL, name of the
env var with the key)`. The URL includes the final `/decisions` path. The step
checks the grant before it reads a credential or sends the state. Without it
the step fails with `decision endpoint and credential are not authorized by
the host`.

`decision_endpoints` is runtime-only. It is never written to chain JSON, and
neither is the key. `api_key_env` defaults to `OPENAI_API_KEY`,
`AZURE_OPENAI_API_KEY` or `OPENROUTER_API_KEY` by provider; a value that looks
like a key instead of a variable name is rejected. `base_url` must be https
(plain http only for localhost) with no credentials, query or fragment.

`chain.preflight(context)` lists the env var names under
`required_decision_credentials` and the unset ones under
`missing_decision_credentials`. Names only, never values.

## DecisionStepConfig

The model rejects unknown fields.

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `provider` | `str` | `"openai"` | `openai`, `azure_openai` or `openrouter`. |
| `model` | `str` | required | Decision model id or Azure deployment name. |
| `questions` | `list[DecisionQuestion]` | required | 1–400 questions, unique names, all about the same state. |
| `state_source` | `str \| None` | `None` | A `$` reference to the state. Defaults to `$outer_context` when `state_template` is unset. Dicts and lists stay structured where the provider accepts JSON. |
| `state_template` | `str \| None` | `None` | `str.format` template rendered with `input_mapping` into a text state. Mutually exclusive with `state_source`. |
| `input_mapping` | `dict[str, str]` | `{}` | Placeholder → source for `state_template` (at most 32). Same rules as the Codex step. |
| `primary_question` | `str \| None` | `None` | Question whose value becomes the step `result`. Defaults to the first one. |
| `fail_on_uncertain` | `bool` | `True` | Fail when an answer is refused or under `min_confidence` and has no `fallback`. |
| `base_url` | `str \| None` | `None` | Endpoint base override (`/decisions` is appended). Required for `azure_openai`. |
| `api_key_env` | `str \| None` | `None` | Env var with the key (provider default when `None`). |
| `timeout` | `float` | `30.0` | Per-request timeout, (0, 600] s. |
| `max_retries` | `int` | `2` | Retries on 408, 429, 5xx and network errors, 0–5, with backoff and `Retry-After`. |
| `max_state_bytes` | `int` | `262144` | Size limit of the serialized state (1 KiB – 4 MiB), checked before the request. |
| `output_memory_key` | `str \| None` | `None` | Write `{question: decided value}` to memory. |
| `output_namespace` | `str` | `"decision"` | Namespace for `output_memory_key`. |

`DecisionQuestion` fields: `name` (a Python identifier; not shown to the model
as meaning, so put the meaning into `instructions`), `type`, `instructions`,
`choices`, `levels`, `threshold` (predicate only), `min_confidence` (choice
and score only), `fallback` (a choice value or a bool for a predicate; score
questions have none).

## Result

- `result`: the primary question's decided value as text. The history entry
  adds a one-line summary of every answer.
- `result_data`: `provider`, `requested_model`, `model` (the snapshot the
  provider served), `request_id`, `primary_question`, `decision`, `answers`,
  `uncertain_questions`, `usage`, `cost_usd` (when the provider reports it).
- `result_data["answers"][name]`: `type`, `value`, `probabilities`,
  `confidence`, `refused`, `uncertain`, `fallback_applied`, plus
  `probability`, `choice` or `score` / `level` by type.
- `token_usage`: provider-reported counts, when available.

## Failure policy

The step fails closed when:

- the grant or the key is missing, the state is empty or over `max_state_bytes`;
- the provider returns an HTTP error after retries (auth and validation errors
  are not retried). Provider error bodies are kept out of `error_message`;
- an answer is malformed: an unknown choice, a probability outside [0, 1], a
  score outside the level range, a non-JSON body;
- an answer is uncertain (refused, missing, or under `min_confidence`) and the
  question has no `fallback`, unless `fail_on_uncertain=False`.

With a `fallback` the uncertain answer is replaced and marked
`fallback_applied=True`. With `fail_on_uncertain=False` it is kept (a refusal
becomes `None`) and marked `uncertain=True`.

## Thresholds

Probabilities and confidences are calibrated differently across models and
move by a few hundredths between runs. Tune `threshold` and `min_confidence`
on labelled examples for the exact model you pin, use bands rather than exact
values, and re-tune after a model or provider change. `result_data["model"]`
records the served snapshot for that reason.

## Testing offline

`DecisionStepExecutor` takes an `httpx` transport. Register one with a canned
reply to run a chain without network:

```python
import httpx
from mmar_carl import DecisionStepExecutor, StepType, register_executor

canned = {"answers": {
    "department": {"type": "choice", "choice": "billing",
                   "probabilities": {"billing": 0.9, "other": 0.1}, "confidence": 0.9},
    "urgent": {"type": "noul", "noul": 0.9},
}}
transport = httpx.MockTransport(lambda request: httpx.Response(200, json=canned))
register_executor(StepType.DECISION, DecisionStepExecutor(transport=transport))
```

This is the OpenRouter reply shape. The key env var must still be set and the
endpoint granted. The repo's
[`decision_step_example.py`](https://github.com/AIRI-MAESTRO/carl/blob/v0.5.2/examples/agents/decision_step_example.py)
runs the same way when no API key is set.

## Limits

- Every question in a step sees the same state. When a question depends on an
  earlier answer, put it in a later step.
- Execution-trace replay does not support decision steps.
- Chain format 14 introduced the step type. A reader older than 0.5.1 rejects
  format 14 and newer with `ChainFormatNewerError`.

## See also

- [Conditional step](/carl/steps/conditional/): route on `$memory.decision.<key>`.
- [Structured output](/carl/steps/structured-output/): when you need generated JSON, not a typed judgment.
- [Preflight](/carl/care-integration/preflight/)
