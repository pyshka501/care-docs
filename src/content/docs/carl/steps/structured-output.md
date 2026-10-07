---
title: Structured Output Step
description: Constrain LLM output to a JSON schema and validate it before the chain moves on.
sidebar:
  order: 7
---

`StructuredOutputStepDescription` runs an LLM call whose answer must be JSON that
matches a declared JSON Schema. The executor validates the answer; a
non-matching answer fails the step. Use it when a downstream step needs
reliably shaped data.

## StructuredOutputStepConfig

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `output_schema` | `dict` | (required) | JSON Schema the output must match. |
| `input_source` | `str` | `"$history[-1]"` | One [reference](/carl/chains/dynamic-references/) whose value becomes the prompt's `Input` block. |
| `input_mapping` | `dict[str, str]` | `{}` | Scoped input: `{name: reference}`. When set, the `Input` block is a JSON object with only these values. |
| `schema_name` | `str` | `"StructuredOutput"` | Human-readable schema name shown to the model. |
| `instruction` | `str` | `""` | Task line for the model (the step title is used when empty). |
| `strict_json` | `bool` | `True` | Ask the model to return only raw JSON. |

The prompt contains the task, the schema name, the schema itself, the `Input`
block, and the JSON instruction. The answer is parsed from raw JSON, from a
fenced code block, or from the first `{...}` / `[...]` in the text.

### Scoped input with `input_mapping`

By default the `Input` block is whatever `input_source` resolves to, usually the
whole previous history entry. `input_mapping` narrows it to exactly the values
you name:

```python
StructuredOutputStepConfig(
    output_schema={...},
    input_mapping={
        "ticket": "$memory.input.ticket",
        "customer_tier": "$memory.input.tier",
    },
)
```

The model then sees `{"ticket": ..., "customer_tier": ...}` and nothing else from
the run. `input_mapping` cannot be combined with a non-default `input_source`;
that combination is rejected when the config is built. Hosts can check for this
contract through the module constant `mmar_carl.STRUCTURED_OUTPUT_SCOPED_INPUTS_ABI`.

## Validation contract

The executor enforces the declared schema instead of trusting the model:

- The schema is checked (`check_schema`) **before any provider call**, so an
  invalid contract fails the step without cost or network I/O.
- Remote references are rejected: `$ref`, `$dynamicRef`, and `$recursiveRef`
  must start with `#`. Validation never fetches anything over the network.
- A `$schema` value naming an unknown dialect **fails closed**
  (`Unsupported JSON Schema dialect`) instead of falling back to the newest draft.
  Without `$schema`, the library's default dialect is used.
- The parsed answer is validated with the dialect's `FORMAT_CHECKER`, so
  `format` keywords such as `email` or `date` are enforced.
- Failure messages name the JSON path and the failed keyword (for example
  `Structured output does not match JSON Schema at $.score: expected type "number"`).
  They **never echo the rejected value**, so model output does not leak into logs.
- There is no automatic re-ask on a schema mismatch. `retry_max` / `context.retry_max`
  only retry the provider call itself.

`jsonschema` (`>=4.23.0,<5.0.0`) is a core dependency of `mmar-carl`.

## What the step records

On success, `result` is the JSON string, `result_data` is the parsed value, and
the history entry is `Step N. Title [STRUCTURED_OUTPUT]` plus `Result: <json>`.
Both success and failure results carry `token_usage` (when the client reports
usage) and `model` (the resolved client model). When the step streams,
`token_usage` stays `{}` rather than reporting zeros.

## Which model runs the step

A structured-output step uses the chain's `default_llm_config` if one is set,
otherwise the context's default client.

:::caution
`StructuredOutputStepDescription` has no `llm_config` field. A per-step
`llm_config=...` passed to it is silently ignored, and so is one on a JSON step
of type `structured_output`. To use a different model for one structured-output
step, give the chain or the context a client for that model.
:::

## From a Pydantic model

The easiest way to build the config is from a Pydantic model. CARL derives the
JSON Schema with `StructuredOutputStepConfig.from_pydantic_model()`:

```python
from pydantic import BaseModel
from mmar_carl import StructuredOutputStepDescription, StructuredOutputStepConfig

class RiskAssessment(BaseModel):
    severity: str
    rationale: str
    score: float

StructuredOutputStepDescription(
    number=2,
    title="Extract risk assessment",
    dependencies=[1],
    config=StructuredOutputStepConfig.from_pydantic_model(
        RiskAssessment,
        input_source="$history[-1]",
        instruction="Base the score on the evidence in the text.",
    ),
)
```

`from_pydantic_model` accepts `input_source`, `instruction`, and `strict_json`.
To use `input_mapping`, build the config directly with
`output_schema=RiskAssessment.model_json_schema()`.

## From a raw JSON Schema

```python
StructuredOutputStepConfig(
    output_schema={
        "type": "object",
        "properties": {
            "severity": {"type": "string"},
            "score": {"type": "number"},
        },
        "required": ["severity", "score"],
    },
    schema_name="RiskAssessment",
)
```

## Streaming

A structured-output step streams token by token when the context has an
[`on_llm_chunk`](/carl/async/streaming/) callback **and** the client supports
streaming. There is no config flag. Chunks reach your callback tagged
`stage="structured_output"`.

The executor watches the running buffer and stops as soon as a balanced JSON
object parses, so it does not wait for trailing tokens after the closing `}`. If
no balanced object appears, it uses the full buffer. The schema check runs on the
result either way.

```python
def on_chunk(chunk: str, **kwargs):
    print(chunk, end="", flush=True)

context.on_llm_chunk = on_chunk   # structured-output steps now stream
```

## See also

- [Structured output example](https://github.com/Glazkoff/carl/blob/main/examples/tool_calling/structured_output_example.py) in the repo.
- [Token-level streaming](/carl/async/streaming/): the `on_llm_chunk` callback.
