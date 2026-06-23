---
title: MAESTRO Metadata
description: Attach typed provenance to a chain, and re-prime a context from it.
sidebar:
  order: 4
---

MAESTRO stamps a typed provenance block onto `chain.metadata["care"]` so a saved chain
remembers the task it was generated for, the files attached, who made it, and its
tags. You can read/write it with two `ReasoningChain` methods.

## Write & read

```python
from mmar_carl import CareChainMetadata, CareContextFile

# kwargs form (handy in code / tests)
chain.set_care_metadata(
    task_description="Summarise the quarterly report",
    context_files=[CareContextFile(path="report.pdf", size_bytes=20480)],
    display_name="Quarterly summariser",
    tags=["finance", "summary"],
)

# or hand over a ready model (CARE's usual path)
chain.set_care_metadata(meta=CareChainMetadata(task_description="..."))

meta = chain.get_care_metadata()   # -> CareChainMetadata | None
```

Pass **either** `meta=` **or** the individual kwargs — mixing raises `ValueError`.
`get_care_metadata()` returns `None` when the chain has no `care` block (i.e. it
wasn't created by a MAESTRO-aware tool).

### CareChainMetadata fields

`task_description`, `context_files` (list of `CareContextFile{path, size_bytes}`),
`generated_by`, `mage_metadata` (dict), `display_name`, `description`, `tags`.
The namespace key is `CARE_METADATA_NAMESPACE` (`"care"`).

## Re-prime a context from a saved chain

`ReasoningContext.from_chain_inputs` builds a fresh context from a chain's MAESTRO
metadata — the "re-run from the library" entry point:

```python
context = ReasoningContext.from_chain_inputs(
    chain,
    api=client,
    outer_context=None,             # falls back to the saved task_description
    load_files_from_metadata=True,  # re-read the attached context_files
)
result = await chain.execute_async(context)
```

Pass `files={...}` to override file contents, or `outer_context=` to override the
input; any extra `**kwargs` (e.g. `language=`, `system_prompt=`) pass through.

## See also

- [Preflight](/carl/care-integration/preflight/) · [RunRecord](/carl/care-integration/run-record/)
- [JSON serialization](/carl/serialization/json/) — MAESTRO metadata round-trips with the chain.
