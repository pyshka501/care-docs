---
title: Structured Output Step
description: Constrain LLM output to a JSON schema, optionally from a Pydantic model.
sidebar:
  order: 7
---

`StructuredOutputStepDescription` runs an LLM step whose output must match a JSON
schema — handy when a downstream step needs reliably-shaped data.

## StructuredOutputStepConfig

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `output_schema` | `dict` | — (required) | JSON Schema the output must match. |
| `input_source` | `str` | `"$history[-1]"` | Input used to build the prompt. |
| `schema_name` | `str` | `"StructuredOutput"` | Human-readable schema name. |
| `instruction` | `str` | `""` | Extra instruction before schema conversion. |
| `strict_json` | `bool` | `True` | Ask the model to return only raw JSON. |

## From a Pydantic model

The easiest way to build the config is from a Pydantic model — CARL derives the
JSON Schema for you with `StructuredOutputStepConfig.from_pydantic_model()`:

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

## See also

- [Structured output example](https://github.com/Glazkoff/carl-experiments/blob/main/examples/tool_calling/structured_output_example.py) in the repo.
