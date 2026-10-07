---
title: Chain Metadata
description: The metadata["care"] block — task, files, tags and Maestro's input contract — and re-priming a context from it.
sidebar:
  order: 4
---

A chain carries a free-form `metadata` dict that round-trips with the JSON.
Maestro keeps its data under the `care` key (`CARE_METADATA_NAMESPACE`):
the task the chain was generated for, attached files, a display name, tags,
and the chain's input contract.

## Typed access

```python
from mmar_carl import CareChainMetadata, CareContextFile

chain.set_care_metadata(
    task_description="Summarise the quarterly report",
    context_files=[CareContextFile(path="report.pdf", size_bytes=20480)],
    display_name="Quarterly summariser",
    tags=["finance", "summary"],
)
# or: chain.set_care_metadata(meta=CareChainMetadata(task_description="..."))

meta = chain.get_care_metadata()   # -> CareChainMetadata | None
```

Pass either `meta=` or keyword fields; mixing them raises `ValueError`.
`get_care_metadata()` returns `None` when the chain has no `care` block.

`CareChainMetadata` fields: `task_description`, `context_files`
(`CareContextFile{path, sha256, size_bytes}`), `generated_by`,
`mage_metadata`, `display_name`, `description`, `tags`.

:::caution
`set_care_metadata()` **replaces** the whole `care` block with the typed
fields. Keys that `CareChainMetadata` does not model are lost, including
Maestro's `runtime_input_schema`; keyword fields you don't pass are reset too
(checked on 0.5.0). To change one value in a chain that came from Maestro,
edit `chain.metadata["care"]` directly.
:::

## Maestro's input contract

Chains generated or saved by Maestro carry a JSON Schema (Draft 2020-12, an
object schema) at `metadata["care"]["runtime_input_schema"]`. Before a run
Maestro validates the user's input against it and passes the result as
`ReasoningContext.runtime_input`; steps read fields with
`$outer_context.<field>`. CARL itself does not read this key; it is a host
convention that travels with the chain. See the
[integration overview](/carl/care-integration/overview/#how-maestro-runs-a-chain).

## Re-prime a context from a saved chain

`ReasoningContext.from_chain_inputs` builds a context from a chain's `care`
block, the "re-run from the library" entry point used by the CLI and TUI:

```python
context = ReasoningContext.from_chain_inputs(
    chain,
    api=client,
    outer_context=None,             # falls back to the saved task_description
    load_files_from_metadata=True,  # re-read the attached context_files
)
result = await chain.execute_async(context)
```

Pass `files={...}` to override file contents, or `outer_context=` to override
the input. Extra keyword arguments (`language=`, `system_prompt=`,
`runtime_input=`, …) go to the `ReasoningContext` constructor.

## See also

- [Preflight](/carl/care-integration/preflight/) · [RunRecord](/carl/care-integration/run-record/)
- [JSON serialization](/carl/serialization/json/) — `metadata` round-trips with the chain.
