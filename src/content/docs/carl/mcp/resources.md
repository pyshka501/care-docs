---
title: MCP Resources
description: Read a named MCP resource into memory and history.
sidebar:
  order: 2
---

MCP **resources** are read-only data exposed by a server (files, docs, schemas) —
distinct from MCP **tools**, which take arguments and perform actions.
`MCPResourceStepDescription` fetches a resource and writes it to memory + history,
with no tool call.

```python
from mmar_carl import MCPResourceStepDescription, MCPResourceStepConfig, MCPServerConfig

MCPResourceStepDescription(
    number=1,
    title="Load API reference",
    config=MCPResourceStepConfig(
        server=MCPServerConfig(server_name="docs", transport="sse", url="http://docs/sse"),
        resource_uri="docs://api/reference.md",
        output_memory_key="api_docs",
    ),
)
```

## MCPResourceStepConfig

| Field | Default | Purpose |
| --- | --- | --- |
| `server` | — | The `MCPServerConfig`. |
| `resource_uri` | — | URI of the resource (e.g. `docs://api/reference.md`). |
| `output_memory_key` | `""` | When set, stores content at `memory[output_namespace][key]`. When empty, it's only in `$history[-1]` / `$metadata.step_N`. |
| `output_namespace` | `"mcp_resource"` | Namespace for the write. |
| `timeout` | `30.0` | Seconds. |

Read the content back later with `$memory.mcp_resource.api_docs` (or your chosen
key/namespace).

## See also

- [MCP overview](/carl/mcp/overview/) — calling tools.
- [Dynamic references](/carl/chains/dynamic-references/) — reading the stored content.
