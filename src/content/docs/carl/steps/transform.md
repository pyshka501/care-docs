---
title: Transform Step
description: Reshape data between steps with no LLM call.
sidebar:
  order: 5
---

`TransformStepDescription` reshapes data **without** an LLM call — cheap, fast,
and deterministic. Good for formatting, extracting, or aggregating prior output.

## TransformStepConfig

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `transform_type` | `"extract" \| "format" \| "aggregate" \| "filter" \| "map"` | — (required) | The kind of transformation. |
| `input_key` | `str` | `"$history[-1]"` | Where the input comes from. |
| `output_format` | `str \| None` | `None` | Output template (for `format`). |
| `expression` | `str \| None` | `None` | Expression for `extract` / `filter`. |
| `map_template` | `str \| None` | `None` | Per-item template for `map`. |

## Example

```python
from mmar_carl import TransformStepDescription, TransformStepConfig

TransformStepDescription(
    number=3,
    title="Format summary",
    dependencies=[2],
    config=TransformStepConfig(
        transform_type="format",
        input_key="$history[-1]",
        output_format="Summary: {value}",
    ),
)
```

## See also

- [Building chains](/carl/chains/builder/) — the `add_transform_step()` shortcut.
- [Dynamic references](/carl/chains/dynamic-references/) — what `input_key` accepts.
