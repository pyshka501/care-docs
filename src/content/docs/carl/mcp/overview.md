---
title: MCP Overview
description: Call tools on Model Context Protocol servers from a chain, either as MCP steps or as registered tools with a session pool.
sidebar:
  order: 1
---

The [Model Context Protocol](https://modelcontextprotocol.io) lets a chain call
tools hosted by an external MCP server. CARL offers two ways to do it:

- **`MCPStepDescription`**: one step calls one named tool on one server.
- **`context.register_mcp_tools(server)`**: discovers all tools on a server and
  registers them as ordinary [tools](/carl/steps/tool/), callable from tool steps
  and agents.

MCP support needs the optional SDK:

```bash
pip install 'mmar-carl[mcp]'
```

Without it, MCP steps fail with an "MCP SDK not installed" error.

## MCP step

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

The result is the tool's content: text blocks are joined with newlines, other
values are JSON-encoded. The history entry is tagged
`[MCP: <server_name>/<tool_name>]`.

### MCPServerConfig

| Field | Default | Purpose |
| --- | --- | --- |
| `server_name` | required | Logical name; used in history and preflight. |
| `transport` | `"stdio"` | `"stdio"` (subprocess), `"http"` (streamable HTTP), `"sse"` (HTTP + Server-Sent Events, the older transport). |
| `command` | `None` | Executable for `stdio`. |
| `args` | `[]` | Arguments for `stdio`. |
| `url` | `None` | Endpoint for `http` / `sse`; required for those transports. |
| `headers` | `{}` | Extra HTTP headers for `http` / `sse` (e.g. `Authorization`). |

There is no field for the server's environment variables or working directory.

:::caution
`MCPServerConfig` is part of the step config and is written to chain JSON as is,
including `headers`. Do not put long-lived tokens in `headers` of a chain you
store or share.
:::

### MCPStepConfig

| Field | Default | Purpose |
| --- | --- | --- |
| `server` | required | The `MCPServerConfig`. |
| `tool_name` | required | MCP tool to call. |
| `arguments` | `{}` | Static arguments. |
| `argument_mapping` | `{}` | Arguments resolved from [references](/carl/chains/dynamic-references/); they override static ones with the same name. |
| `timeout` | `60.0` | Seconds for the `call_tool` request. |

### How a call runs

Each MCP step opens its own connection: it starts the `stdio` process (or opens
the HTTP / SSE stream), runs `initialize()`, calls the tool and closes the
connection. `timeout` bounds the tool call; for `http` / `sse` it is also the
HTTP client timeout. MCP steps do not use the session pool.

## Registered MCP tools and the session pool

```python
names = await context.register_mcp_tools(server)
# ["mcp:my_server/search", "mcp:my_server/fetch", ...]
```

`register_mcp_tools(server, *, prefix=None, timeout=30.0, tags=None)` calls
`list_tools()` once and registers a wrapper per tool. The default name prefix is
`mcp:<server_name>/`. Each wrapper call opens a fresh session unless a pool is
active:

```python
async with context.mcp_pool() as pool:
    await context.register_mcp_tools(server)
    result = await chain.execute_async(context)
    pool.stats()   # {"open": True, "active_sessions": 1, "server_keys": [...]}
```

While the pool is open, `register_mcp_tools`, the registered tool wrappers and
`list_mcp_resources` reuse one initialized `ClientSession` per server, keyed by
`(server_name, transport, command or url)`. All sessions close when the
`async with` block exits. `MCPSessionPool` can also be used on its own
(`async with MCPSessionPool() as pool: session = await pool.acquire(server)`).

## Status and limits

MCP is a supported, non-experimental part of CARL 0.5.0. Live tests against a
real FastMCP server run under `pytest -m mcp_live`. Known limits:

- An MCP step is an ordinary step for [run controls](/carl/chains/run-controls/)
  and [streaming](/carl/async/streaming/): cancellation and pause are checked
  between steps, not inside a running tool call, and the tool's output is not
  streamed.
- The step does not inspect the result's `isError` flag. A tool that returns an
  error result still produces a successful step whose result is the error text.
- `from_json()` / `load()` rebuild an MCP step as a legacy `StepDescription`; use
  the typed loader to get `MCPStepDescription` back. See
  [JSON serialization](/carl/serialization/json/).

## Preflight

`chain.preflight(context)` lists the server names of all MCP and MCP-resource
steps in `required_mcp_servers`. Servers are described by the step config, so
CARL cannot tell whether one is reachable: `missing_mcp_servers` is always
empty. See [Preflight](/carl/care-integration/preflight/).

:::tip
If a capability is available as a Python function, registering it with
`context.register_tool(...)` has fewer moving parts than a live server.
:::

## See also

- [MCP resources](/carl/mcp/resources/): read data from a server instead of calling tools.
- [Tool steps](/carl/steps/tool/) · [Dynamic references](/carl/chains/dynamic-references/)
