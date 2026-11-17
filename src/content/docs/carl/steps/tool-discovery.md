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
| `source` | `ModuleToolSource \| CallableToolSource \| DictToolSource \| GitToolSource` | (required) | Where to discover tools. |
| `output_memory_key` | `str` | `""` | If set, the sorted list of tool names is written to `memory["tools"][output_memory_key]`, i.e. `$memory.tools.<key>`. |
| `tool_timeout` | `float \| None` | `None` | Per-call timeout applied to discovered **sync** tools. No effect on async tools. |

The step's `result_data` is `{"tool_names": [...]}`.

### Tool sources

| Source | Discovers |
| --- | --- |
| `ModuleToolSource(module, name_prefix="", tag="", strip_prefix=False)` | Imports `module` and takes its public callables, filtered as described below. |
| `CallableToolSource(factory)` | Calls `factory()`, which must return `{name: callable}`. |
| `DictToolSource(tools)` | An explicit `{name: callable}` dict. |
| `GitToolSource(git_url, module_file, git_ref="HEAD", git_subdirectory=None, function=None, sha256=None)` | Clones a Git repository and imports one module file from it. Takes the `@carl_tool`-decorated functions, or only `function` when it is set. New in 0.5.0. |

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
them cannot be fully described in JSON. `ModuleToolSource` holds only a module
path, and `GitToolSource` only a repository, a revision and digests.

## Tools from a pinned Git commit

`GitToolSource` loads tool code from a Git checkout. Pin it two ways: set
`git_ref` to a full commit SHA, and list the expected SHA-256 of each file you
rely on in `sha256` (paths relative to `git_subdirectory`).

```python
from mmar_carl import ToolDiscoveryStepConfig, ToolDiscoveryStepDescription
from mmar_carl.models.config import GitToolSource

ToolDiscoveryStepDescription(
    number=1,
    title="Load pinned text tools",
    config=ToolDiscoveryStepConfig(
        source=GitToolSource(
            git_url="https://github.com/acme/text-tools.git",
            git_ref="<40-char commit sha>",
            module_file="tools.py",
            sha256={"tools.py": "<sha256 of tools.py>"},
        ),
        output_memory_key="git_tools",   # → $memory.tools.git_tools
    ),
)
```

- A full 40- or 64-hex `git_ref` is fetched with `--depth=1` and checked out
  exactly; any other value is cloned as a branch or tag (`HEAD` = the default
  branch). Only a commit SHA pins the code.
- Checkouts are cached under `~/.cache/mmar_carl/skills/git/`, keyed by URL,
  ref and subdirectory. The digests are checked on every load, cache hits
  included. A mismatch fails the step (`SHA256 mismatch for tools.py: …`).
- `module_file` and the `sha256` paths must stay inside the checkout.
- Without `function`, only callables marked by `@carl_tool` are registered,
  with their tags. With `function`, just that one callable is registered.
- Loading executes the module in the host process. Pin only code you trust.
  `GitToolSource` is not a top-level export; import it from
  `mmar_carl.models.config`.

AgentSkills use the same Git loader and digest check; see
[skill resolvers](/carl/skills/resolvers/).

## See also

- [Tool steps](/carl/steps/tool/): calling registered tools.
- `ToolDefinition` (exported from `mmar_carl`) for building tools programmatically.
