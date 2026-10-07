---
title: Chain Tools
description: Embed a complete chain as a typed, isolated tool that other steps can call — schemas, isolation, limits, versioned host tools and outcomes.
sidebar:
  order: 19
---

A **chain tool** packs a whole `ReasoningChain` into a callable tool. The parent
chain stores it in its top-level `chain_tools` field; at run time it is
registered under its own name, so a [tool step](/carl/steps/tool/), an
[agent step](/carl/steps/agent/) or a [map step](/carl/steps/map/) can call it
like any function.

Use it to reuse a tested sub-chain with a strict contract: typed input, typed
output, its own budget, and no access to the parent's state. To run a sub-chain
that shares the parent's memory, use [handoff](/carl/orchestration/handoff/)
instead.

## Define a chain tool

```python
from mmar_carl import (
    ChainToolDefinition, ReasoningChain, ToolStepConfig, ToolStepDescription,
)

child = ReasoningChain(steps=[
    ToolStepDescription(
        number=1,
        title="Normalize text",
        config=ToolStepConfig(tool_name="normalize",
                              input_mapping={"payload": "$outer_context"}),
    ),
])

normalizer = ChainToolDefinition.from_chain(
    name="normalize_with_chain",
    description="Run the pinned normalizer chain.",
    chain=child,
    input_schema={
        "type": "object",
        "properties": {"text": {"type": "string"}},
        "required": ["text"],
        "additionalProperties": False,
    },
    output_schema={
        "type": "object",
        "properties": {"normalized": {"type": "string"}},
        "required": ["normalized"],
        "additionalProperties": False,
    },
    output_reference="$steps.1.result_data",
    allowed_tools=["normalize"],        # host tools the child may use
    timeout_seconds=5,
)
```

`from_chain` freezes the child through `chain.to_dict()`. Later edits to `child`
do not change the tool.

## Use it from a parent chain

```python
parent = ReasoningChain(
    steps=[
        ToolStepDescription(
            number=1,
            title="Invoke child chain",
            config=ToolStepConfig(tool_name="normalize_with_chain",
                                  input_mapping={"text": "$outer_context"}),
        ),
    ],
    chain_tools=[normalizer],
)

context = ReasoningContext(outer_context="  CARL Composition  ", api=client)
context.register_tool("normalize", normalize)    # every allowed_tools entry must exist

result = await parent.execute_async(context)
outcome = ChainToolOutcome.model_validate(result.step_results[0].result_data)
if outcome.success:
    print(outcome.output)        # {'normalized': 'carl composition'}
else:
    print(outcome.status, outcome.error_code, outcome.error_message)
```

With `ChainBuilder`, add definitions with `.add_chain_tool(definition)`. To
register a definition on a context directly, call
`context.register_chain_tool(definition)`; re-registering the same contract is a
no-op, and a name clash with a different tool raises unless `replace=True`.

:::caution
The tool step that calls a chain tool **succeeds even when the nested chain
failed**: the tool returned a valid envelope. Always check
`ChainToolOutcome.status` (or `success`). Only `completed` is a success.
:::

## ChainToolDefinition

The model is frozen and rejects unknown fields.

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `name` | `str` | required | Tool name: letter or `_` first, then letters, digits, `_`, `-`; ≤ 64 chars. `finish` is reserved. |
| `description` | `str` | required | ≤ 2000 chars, non-blank. |
| `chain_snapshot` | `dict` | required | A complete `ReasoningChain.to_dict()` payload (`format_version` and `steps` required). |
| `snapshot_sha256` | `str` | computed | SHA-256 of the canonical snapshot JSON. If you pass one, it must match. |
| `input_schema` | `dict` | required | Schema for the keyword arguments. Must be `type: object`. |
| `output_schema` | `dict` | required | Schema for the value read from the child after it finishes. |
| `output_reference` | `str` | required | Child reference to read: `$history…`, `$memory.…`, `$metadata.…`, `$steps.…` or `$outer_context…`. |
| `allowed_tools` | `list[str]` | `[]` | Host tools copied into the child context. Unique names; a tool cannot list itself. |
| `required_tool_revisions` | `dict[str, str]` | `{}` | Pinned revisions of host tools (see below). |
| `tags` | `list[str]` | `["chain"]` | Tags of the registered tool (for `allowed_tool_tags`). |
| `max_depth` | `int` | `4` | Nesting limit, 1–32. |
| `timeout_seconds` | `float` | `120.0` | Budget for one invocation, finite, ≤ 86 400. |
| `max_input_bytes` | `int` | `1000000` | Limit for the JSON-encoded arguments (≤ 16 MB). |
| `max_output_bytes` | `int` | `1000000` | Limit for the JSON-encoded output (≤ 16 MB). |
| `contract_version` | `1` | `1` | Envelope version. |

### Schema subset

Both schemas use a small JSON Schema subset, checked when the definition is
built: `type` (`null`, `boolean`, `integer`, `number`, `string`, `array`,
`object`), `properties`, `required`, `items`, `enum`, and
`additionalProperties: false`. Any other keyword is rejected.

## Isolation

The child gets a fresh context:

- the validated arguments as JSON in `outer_context`, so `$outer_context` and
  `$outer_context.<field>` read them (they are also its `runtime_input`);
- the parent's LLM client, model, language, system prompt and retry settings;
- **only** the host tools named in `allowed_tools`, and the chain tools embedded
  in its own snapshot;
- empty memory and history.

It cannot read the parent's history, memory, messages or metadata, and it does
not inherit callbacks, the event bus, `CommandPolicy`, the network enforcer or
other execution authority. Cancelling the parent cancels the child.

## Checks before and during a run

When the parent chain is built:

- chain tool names must be unique;
- a definition may not list a sibling chain tool in `allowed_tools`; nest it in the
  child's own `chain_tools` instead;
- every tool the child snapshot requires must be in `allowed_tools`.

When the parent runs, every `allowed_tools` entry must be registered on the
context, or execution stops with `Embedded chain tools require missing host
tools: …`. A name already taken by a different tool is an error.

## Versioned host tools

`required_tool_revisions` pins the host tools a chain tool depends on. Keys must
be in `allowed_tools`; values are SHA-256 hex digests. Before each invocation the
runtime compares each value with the callable's `__carl_tool_revision__`
attribute. A tool with another revision (or none) makes the call `unavailable`
with `error_code="missing_host_tools"`.

```python
def normalize(payload):
    return {"normalized": payload["text"].strip().lower()}

normalize.__carl_tool_revision__ = "<sha256 of this tool version>"

pinned = ChainToolDefinition.model_validate({
    **normalizer.model_dump(),
    "required_tool_revisions": {"normalize": "<sha256 of this tool version>"},
})
```

`from_chain` has no parameter for revisions, so add them as shown.

## ChainToolOutcome

Every call returns this envelope (as a dict in the tool step's `result_data`):

| Field | Meaning |
| --- | --- |
| `status` | `completed`, `failed`, `cancelled`, `timed_out`, `invalid_input`, `invalid_output`, `unavailable` or `recursion_limit`. |
| `success` | `True` only for `completed`. |
| `output` | The schema-valid output; only on `completed`. |
| `error_code`, `error_message` | Why it did not complete. |
| `invocation_id`, `tool_name`, `depth` | Identity of this call. |
| `snapshot_sha256`, `input_sha256`, `output_sha256` | Provenance digests. `output_sha256` only on `completed`. |
| `duration_seconds`, `token_usage`, `executed_steps` | Cost of the call. |

| `status` | Typical `error_code` |
| --- | --- |
| `invalid_input` | `input_not_json`, `input_too_large`, `input_schema_mismatch` |
| `unavailable` | `missing_host_tools`, `invalid_chain_snapshot`, `snapshot_digest_mismatch` |
| `recursion_limit` | `recursion_limit` (a cycle, or deeper than `max_depth`) |
| `cancelled` | `cancelled_by_host` |
| `timed_out` | `chain_tool_timeout` |
| `failed` | `nested_chain_failed`, `nested_execution_exception` |
| `invalid_output` | `output_not_json`, `output_too_large`, `output_schema_mismatch` |

## Serialization

`chain_tools` is written by `to_dict()` and read back by `from_dict()`. Chain JSON
older than the `chain_tools` field migrates with `ReasoningChain.migrate(raw)`,
which adds an empty list. A runtime that does not know the field rejects the chain
with `ChainFormatNewerError` instead of silently dropping nested chains. See
[migration](/carl/serialization/migration/).

## See also

- [Handoff](/carl/orchestration/handoff/): run a sub-chain that shares the parent's state.
- [Tool step](/carl/steps/tool/) · [Agent step](/carl/steps/agent/) · [Map step](/carl/steps/map/)
- [Example](https://github.com/Glazkoff/carl/blob/main/examples/agents/chain_as_tool_example.py) in the repo.
