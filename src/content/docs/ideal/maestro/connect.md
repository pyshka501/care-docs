---
title: Connect Maestro to IdeaL
description: Point Maestro at an IdeaL memory API and namespace. What the IdeaL chain memory changes in generation, evolution and saving, and what read-only mode turns off.
sidebar:
  order: 1
---

Maestro talks to IdeaL through its memory connection. IdeaL is not a separate
service: it is part of the same GigaEvo Memory API that stores your chains.

## Settings

In the desktop app, open **Settings → MAESTRO → Memory and IdeaL** (*Память и IdeaL*).
The full field list is on [Settings](/care/app/settings/).

| Field | What to enter |
| --- | --- |
| **Memory address** (*Адрес памяти*) | The memory API. Local Compose stack: `http://localhost:8000/api` (through nginx) or `http://localhost:8002` (direct port). A hosted store: include its `/api` prefix; a pasted IdeaL page address is cut to its `/api` root. |
| **IdeaL key** (*Ключ IdeaL*) | Only shows whether a key is saved. You enter the key once, on the sign-in page of the [IdeaL panel](/care/app/ideas/). Maestro checks it and keeps it in the app's `.env` file (`~/Documents/Maestro/.env`); the agent never sees it. |
| **Chain memory** (*Память цепочек*) | **Library search** (default) or **IdeaL (ideas and learning from evolutions)**. |
| **IdeaL namespace** (*Пространство IdeaL*) | Required for IdeaL unless a project is set. Latin letters, digits, `.`, `_`, `:`, `-`; starts with a letter or digit; up to 128 characters; case-sensitive. |
| **IdeaL project** (*Проект IdeaL*) | On stands with projects: a slug or id. Empty means automatic. |
| **Read only** | Under **Advanced** (*Расширенные*). Never write to this memory. Use it for shared or hosted stores you only want to look at. |

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
| IdeaL panel | Not used. | The lake radar, the idea graph and run pages, embedded from IdeaL. See [IdeaL panel](/care/app/ideas/). |
| Chat facts | Local memory. | Still local memory. IdeaL never receives chat facts. |

Generation sends only the bounded task text to the catalog. Attachments,
chat history and long-term facts are not sent.

## Read-only mode

With **Read only** on:

- saving, archiving and restoring ideas are disabled;
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
