---
title: MCP Resources
description: Read a named MCP resource into memory and history, and list what a server exposes.
sidebar:
  order: 2
---

MCP **resources** are read-only data exposed by a server (files, docs, schemas).
MCP **tools** take arguments and perform actions. `MCPResourceStepDescription`
reads one resource with `session.read_resource(uri)` and writes it to memory and
history. No tool is called.

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

It needs the `mmar-carl[mcp]` extra and uses the same transports and
`MCPServerConfig` as [MCP steps](/carl/mcp/overview/#mcpserverconfig). Like MCP
steps, it opens its own connection per run and does not use the session pool.

## MCPResourceStepConfig

| Field | Default | Purpose |
| --- | --- | --- |
| `server` | required | The `MCPServerConfig`. |
| `resource_uri` | required, non-empty | URI of the resource, e.g. `docs://api/reference.md`. |
| `output_memory_key` | `""` | When set, content goes to `memory[output_namespace][output_memory_key]`. When empty, it is only in the step result and `$history[-1]`. |
| `output_namespace` | `"mcp_resource"` | Namespace for that write. |
| `timeout` | `30.0` | Seconds for the `read_resource` call; must be > 0. |

Read the content later with `$memory.mcp_resource.api_docs` (or your key and
namespace), see [dynamic references](/carl/chains/dynamic-references/).

## What is stored

- One content item with `text`: the text.
- One content item with `blob`: the blob as returned by the server (base64 text).
- Several items: the whole list, as returned.
- No items: an empty string.

Memory receives this value as is. The step result is the value as a string
(non-strings are JSON-encoded). The history entry, tagged
`[MCP RESOURCE: <server_name>/<uri>]`, keeps only the first 1000 characters.

## Listing resources

```python
resources = await context.list_mcp_resources(server, timeout=30.0)
for r in resources:
    print(r.uri, r.name)
```

`list_mcp_resources` returns the server's resource descriptors (typically
`uri`, `name`, `description`, `mimeType`). It reuses the pooled session inside
`async with context.mcp_pool():`.

## See also

- [MCP overview](/carl/mcp/overview/): calling tools, the session pool, preflight.
- [Dynamic references](/carl/chains/dynamic-references/): reading the stored content.
