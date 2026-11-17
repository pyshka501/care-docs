---
title: Transform Step
description: Reshape data between steps with no LLM call.
sidebar:
  order: 5
---

`TransformStepDescription` reshapes data **without** an LLM call. It is cheap,
fast, and deterministic. Use it to format, extract, filter, or join prior output.

## TransformStepConfig

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `transform_type` | `"extract" \| "format" \| "aggregate" \| "filter" \| "map"` | (required) | The kind of transformation. |
| `input_key` | `str` | `"$history[-1]"` | A [reference](/carl/chains/dynamic-references/) for the input. An unresolved reference becomes `""`. |
| `output_format` | `str \| None` | `None` | Template for `format`; the input is available as `{input}`. |
| `expression` | `str \| None` | `None` | Regular expression for `extract` / `filter`. |
| `map_template` | `str \| None` | `None` | Per-item template for `map`; the item is available as `{item}`. |

## What each type does

| `transform_type` | Behaviour |
| --- | --- |
| `extract` | `re.findall(expression, str(input))`, a list of matches. Without `expression`, returns the input unchanged. |
| `format` | `output_format.format(input=input)`. Without `output_format`, `str(input)`. |
| `aggregate` | A list is joined with newlines; anything else becomes `str(input)`. |
| `filter` | Keeps list items (or lines of a string) where `re.search(expression, ...)` matches. Without `expression`, returns the input unchanged. |
| `map` | Applies `map_template.format(item=item)` to every list item. Non-list input is returned unchanged. |

`result_data` holds the transformed value; `result` is that value as a string
(JSON for non-strings).

:::caution
`format` only knows the `{input}` placeholder and `map` only `{item}`. Any other
placeholder (for example `{value}`) raises `KeyError` and fails the step. Literal
braces must be doubled: `{{` and `}}`.
:::

## Example

```python
from mmar_carl import TransformStepDescription, TransformStepConfig

TransformStepDescription(
    number=3,
    title="Format summary",
    dependencies=[2],
    config=TransformStepConfig(
        transform_type="format",
        input_key="$metadata.step_2",
        output_format="Summary: {input}",
    ),
)
```

`$metadata.step_2` is step 2's result value. `$history[-1]` would give the whole
history entry instead, including the `Step N. Title` header.

## See also

- [Building chains](/carl/chains/builder/): the `add_transform_step()` shortcut.
- [Dynamic references](/carl/chains/dynamic-references/): what `input_key` accepts.
