---
title: Tool Discovery
description: Register tools in bulk with @carl_tool and discover them at runtime.
sidebar:
  order: 11
---

Besides registering tools one by one with `context.register_tool(...)` (see
[tool steps](/carl/steps/tool/)), CARL can register tools in bulk: from files on
disk before the run, or from a module, factory, or dict during the run with a
`tool_discovery` step.

## The `@carl_tool` decorator

`@carl_tool` marks a function as a CARL tool and optionally tags it. It sets
`__carl_tool__ = True` and, with `tags`, `__carl_tool_tags__` on the function;
the function itself is unchanged.

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

`context.register_tools_from_path` loads every `.py` file matching a glob and
registers each public function carrying `@carl_tool`:

```python
names = context.register_tools_from_path(
    "tools/**/*.py",              # glob, recursive; ~ is expanded
    tag_filter=["information"],   # optional: only tools with at least one of these tags
    name_prefix="ext_",           # optional: prepended to each registered name
)
```

It returns the registered names in discovery order. Things to know:

- Each matching file is **imported, so its top-level code runs**. Only point it
  at directories you trust.
- Files that fail to import are skipped silently (logged at DEBUG).
- A name that is already registered is overwritten. Use `name_prefix` to keep
  directories apart.

## Discover at runtime as a step

`ToolDiscoveryStepDescription` discovers tools from a **tool source** during the
run and registers them in the context, so later [tool steps](/carl/steps/tool/)
can call them. It makes no LLM call.

```python
from mmar_carl import (
    ToolDiscoveryStepDescription, ToolDiscoveryStepConfig, ModuleToolSource,
)

ToolDiscoveryStepDescription(
    number=1,
    title="Discover tools",
    config=ToolDiscoveryStepConfig(
        source=ModuleToolSource(module="my_pkg.tools", tag="search"),
        output_memory_key="discovered_tools",
    ),
)
```

### ToolDiscoveryStepConfig

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `source` | `ModuleToolSource \| CallableToolSource \| DictToolSource` | (required) | Where to discover tools. |
| `output_memory_key` | `str` | `""` | If set, the sorted list of tool names is written to `memory["tools"][output_memory_key]`, i.e. `$memory.tools.<key>`. |
| `tool_timeout` | `float \| None` | `None` | Per-call timeout applied to discovered **sync** tools. No effect on async tools. |

The step's `result_data` is `{"tool_names": [...]}`.

### Tool sources

| Source | Discovers |
| --- | --- |
| `ModuleToolSource(module, name_prefix="", tag="", strip_prefix=False)` | Imports `module` and takes its public callables, filtered as described below. |
| `CallableToolSource(factory)` | Calls `factory()`, which must return `{name: callable}`. |
| `DictToolSource(tools)` | An explicit `{name: callable}` dict. |

`ModuleToolSource` filters:

- `name_prefix`: keep only callables whose name starts with it. It is a
  **filter**, not a namespace.
- `strip_prefix=True`: register them without the prefix (`tool_search` →
  `search`).
- `tag`: keep only callables whose `@carl_tool` tags include it.

:::caution
Without `tag`, `ModuleToolSource` does **not** look for `@carl_tool`. It registers
every public callable in the module, including imported functions and classes.
Use `tag` or `name_prefix` to restrict it, or point it at a module that contains
only tools.
:::

`CallableToolSource` and `DictToolSource` hold Python callables, so a chain using
them cannot be fully described in JSON. `ModuleToolSource` holds only a module path.

## See also

- [Tool steps](/carl/steps/tool/): calling registered tools.
- `ToolDefinition` (exported from `mmar_carl`) for building tools programmatically.
