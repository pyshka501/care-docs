---
title: Connect Maestro to IdeaL
description: Point Maestro at an IdeaL memory API and namespace. What the IdeaL chain memory changes in generation, evolution and saving, and what read-only mode turns off.
sidebar:
  order: 1
---

Maestro talks to IdeaL through its memory connection. IdeaL is not a separate
service: it is part of the same GigaEvo Memory API that stores your chains.

## Settings

In the desktop app, open **Settings → Research and Memory**.

| Field | What to enter |
| --- | --- |
| **Memory base URL** | The memory API. Local Compose stack: `http://localhost:8000/api` (through nginx) or `http://localhost:8002` (direct port). A hosted store: include its `/api` prefix. |
| **Memory API key** | Your IdeaL key. Stored in the system keychain, never shown to the agent. |
| **Read only** | Never write to this memory. Use it for shared or hosted stores you only want to look at. |
| **Chain memory** | `Library search` (default) or `IdeaL (ideas + evolution learning)`. |
| **IdeaL namespace** | Required for IdeaL. Latin letters, digits, `.`, `_`, `:`, `-`; starts with a letter or digit; up to 128 characters; case-sensitive. |

The same settings for the CLI and the TUI, as environment variables:

```bash
CARE_MEMORY__BASE_URL=http://localhost:8000/api
CARE_MEMORY__API_KEY=<key>
CARE_MEMORY__RETRIEVAL_BACKEND=ideal      # default: legacy
CARE_MEMORY__IDEAL_NAMESPACE=my-team
CARE_MEMORY__READ_ONLY=false
```

Maestro rejects the configuration when `RETRIEVAL_BACKEND=ideal` has no namespace.
`CARE_MEMORY__IDEAL_NAMESPACE=` (empty) means "not set".

The key must be allowed to read and write the namespace (see
[Namespaces and keys](/ideal/concepts/namespaces-and-keys/)). Typical errors
and what they mean:

| Message from Maestro | Cause |
| --- | --- |
| "Хранилище идей ответило 401" | The key was rejected, or no key reached the server. Paste only the key itself. |
| "… 403 … у ключа нет доступа к этому пространству идей" | The key may not touch this namespace. |
| "… 404 … адрес должен заканчиваться на /api" | The base URL points at the web UI, not at the API. |

## What the IdeaL chain memory changes

| Area | `Library search` | `IdeaL` |
| --- | --- | --- |
| Generation hints | Library search over saved chains and cards. | One `mode=catalog` retrieve with the task: up to 4 hints, split between task chains and ideas. Catalog reads are not recorded. |
| Evolution | Runs without memory. | Each run gets `memory_backend=ideal`, the namespace and a stable task key. Evolution receives idea slates and reports outcomes. See [Evolution](/ideal/maestro/evolution/). |
| Saving chains, ideas, tools | Owner namespace of the key. | The configured IdeaL namespace. |
| Library → Ideas | Not available. | The idea graph, idea form, archive, run radars. See [Ideas in the Library](/ideal/maestro/library/). |
| Chat facts | Local memory. | Still local memory. IdeaL never receives chat facts. |

Generation sends only the bounded task text to the catalog. Attachments,
chat history and long-term facts are not sent.

## Read-only mode

With **Read only** on:

- the idea form, archive and restore are disabled;
- evolution runs **without** IdeaL memory, because IdeaL evolution writes
  retrieval receipts and outcomes;
- generation still reads catalog hints;
- forcing an idea from the run radar is **not** blocked (a known gap: it
  writes to the run on the server).

## Checking the connection

- The Library's Ideas section opens the graph of the configured namespace.
  If it says the graph is unavailable, the message names the HTTP status.
- Ask the agent "покажи пространства идей": it calls
  `maestro_ideal_namespaces` and lists the namespaces this key can read, with
  the server's capabilities (graph, timeline, adding ideas, tools, seeding).

Maestro reads the server's live OpenAPI schema once to find out which IdeaL
features exist. On an older server, missing features are hidden or reported
as unavailable instead of failing.
