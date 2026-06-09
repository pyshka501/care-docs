---
title: Tool Discovery
description: Register tools with @carl_tool and discover them dynamically at runtime.
sidebar:
  order: 11
---

Beyond registering tools one-by-one with `context.register_tool(...)` (see
[tool steps](/carl/steps/tool/)), CARL 0.3.0 can **discover** tools in bulk.

## The `@carl_tool` decorator

Mark functions as discoverable, optionally tagging them:

```python
from mmar_carl import carl_tool

@carl_tool
def search(query: str) -> str:
    ...

@carl_tool(tags=["information", "external"])
def fetch_data(url: str) -> dict:
    ...
```

## Register from disk

Load every `@carl_tool` in files matching a glob in one call:

```python
names = context.register_tools_from_path(
    "tools/*.py",
    tag_filter=["information"],   # optional: only tools carrying these tags
    name_prefix="ext_",          # optional: namespace the registered names
)
```

## Discover at runtime as a step

`ToolDiscoveryStepDescription` discovers + registers tools mid-chain from a
**tool source**:

```python
from mmar_carl import (
    ToolDiscoveryStepDescription, ToolDiscoveryStepConfig, ModuleToolSource,
)

ToolDiscoveryStepDescription(
    number=1,
    title="Discover tools",
    config=ToolDiscoveryStepConfig(
        source=ModuleToolSource(module="my_pkg.tools", tag="search", name_prefix="x_"),
        output_memory_key="discovered_tools",
    ),
)
```

### Tool sources

| Source | Discovers from |
| --- | --- |
| `ModuleToolSource(module, name_prefix="", tag="", strip_prefix=…)` | A Python module path — scans it for `@carl_tool` functions. |
| `CallableToolSource(factory)` | A `factory() -> {name: callable}` you provide. |
| `DictToolSource(tools)` | An explicit `{name: callable}` dict. |

`ToolDiscoveryStepConfig` also takes `tool_timeout`. Discovered tool names are
written to `output_memory_key` so later steps can see what's available.

## See also

- [Tool steps](/carl/steps/tool/) — calling registered tools.
- `ToolDefinition` (exported) composes tools programmatically.
