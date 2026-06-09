---
title: MCP Overview
description: Call tools on Model Context Protocol servers from a chain.
sidebar:
  order: 1
---

The [Model Context Protocol](https://modelcontextprotocol.io) lets a chain call
tools hosted by an external MCP server. `MCPStepDescription` invokes one such tool.
(In v0.3.0 MCP graduated from experimental.)

```bash
pip install 'mmar-carl[mcp]'
```

```python
from mmar_carl import MCPStepDescription, MCPStepConfig, MCPServerConfig

MCPStepDescription(
    number=1,
    title="Search via MCP",
    config=MCPStepConfig(
        server=MCPServerConfig(
            server_name="my_server",
            command="python",
            args=["-m", "my_mcp_server"],   # stdio transport
        ),
        tool_name="search",
        argument_mapping={"query": "$history[-1]"},
    ),
)
```

## MCPServerConfig

| Field | Default | Purpose |
| --- | --- | --- |
| `server_name` | — | Logical name for the server. |
| `transport` | `"stdio"` | `"stdio"` (subprocess), `"http"` (streamable HTTP), `"sse"` (HTTP + Server-Sent Events). |
| `command` / `args` | — | How to launch a `stdio` server. |
| `url` | — | Base URL for `http` / `sse`. |
| `headers` | `{}` | Extra HTTP headers (e.g. `Authorization`) for `http` / `sse`. |

## MCPStepConfig

| Field | Default | Purpose |
| --- | --- | --- |
| `server` | — | The `MCPServerConfig`. |
| `tool_name` | — | MCP tool to call. |
| `arguments` | `{}` | Static arguments. |
| `argument_mapping` | `{}` | Arguments resolved from [references](/carl/chains/dynamic-references/). |
| `timeout` | `60.0` | Seconds. |

Connections are managed by an internal pool (`mcp_pool`), and MCP runs support
pause/resume, cancellation, streaming, and lossless serialization.

:::tip
For production, prefer registering MCP capabilities as ordinary [tools](/carl/steps/tool/)
via `context.register_tool(...)` when you can — fewer moving parts than a live
server connection.
:::

## See also

- [MCP resources](/carl/mcp/resources/) — read data (not call tools) from a server.
