---
title: MAESTRO CARE Integration
description: The 0.3.0 APIs that let MAESTRO CARE (and MAESTRO CARE-aware tools) save, re-run, and introspect chains.
sidebar:
  order: 1
---

CARL 0.3.0 added a typed surface that [MAESTRO CARE](/care/getting-started/quick-start/) (and
any MAESTRO CARE-aware tool) uses to persist, re-run, and introspect chains. You can use
these directly too.

| Piece | What it's for |
| --- | --- |
| [Preflight](/carl/care-integration/preflight/) | Statically ask what a chain needs (tools / MCP servers / skills) before running — and what's missing. |
| [RunRecord](/carl/care-integration/run-record/) | A durable, replayable audit record of one execution (chain + input + result + timing). |
| [MAESTRO CARE metadata](/carl/care-integration/metadata/) | A typed provenance block on the chain (task, attached files, tags) — and re-priming a context from it. |

These are the building blocks behind the MAESTRO CARE Library: save a generated chain with
its metadata, preflight it before a re-run, execute, and store a `RunRecord` of
each run.
