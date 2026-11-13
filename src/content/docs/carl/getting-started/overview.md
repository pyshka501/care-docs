---
title: What is CARL?
description: The format reasoning chains are written in — typed steps, dependencies, and DAG execution — with mmar-carl 0.5.2 as its reference library.
sidebar:
  order: 1
---

**CARL** is the format reasoning chains are written in. A chain is a list of typed
**steps** with dependencies, per-step context queries, and execution settings. The
reference implementation is the `mmar-carl` Python library (Collaborative Agent
Reasoning Library). It reads a chain, builds a directed acyclic graph (DAG), runs
everything that can run in parallel, and pulls relevant context from your input
for each step.

In Maestro, chains are generated in this format and executed by this library.
The Maestro app currently runs an older pinned CARL build, not 0.5.2; see
[which CARL Maestro runs](/carl/care-integration/overview/#which-carl-maestro-runs).
You can also write and run CARL chains directly from Python.

The current release is **0.5.2** (2026-11-09, on PyPI as `mmar-carl`; source:
[github.com/AIRI-MAESTRO/carl](https://github.com/AIRI-MAESTRO/carl)).

## What it gives you

- **DAG execution**: steps run in parallel when their dependencies allow.
- **29 step types**: LLM and structured output, tools and MCP, memory and
  transforms, conditionals and loops, bounded agents and planners, delegation
  to Claude Code or Codex, strictly sandboxed code and commands, waits and
  fan-out, selection, typed decision-model questions, early termination, and
  multi-agent orchestration (handoff, supervisor, debate, parallel sampling,
  human input). See [the step list](/carl/steps/overview/).
- **Chains as tools**: embed a tested chain as a typed, isolated tool.
- **Host-owned authority**: a serialized chain only requests; tools, command and
  code policies, network enforcement, human-input providers, local-agent
  approval and decision endpoints come from the host at run time.
- **Run controls**: fail-fast, acknowledged pause/resume, cancel, timeouts.
- **Async and streaming**: `execute_async`, `stream_async`, per-step callbacks.
- **Evolution and evaluation**: chain mutation, primitives for external
  evolution engines, metrics, dataset evaluation, reflection.
- **Observability**: execution traces, token and cost data, Langfuse.
- **Clients**: any OpenAI-compatible API (OpenRouter, Azure, Ollama, vLLM, LM
  Studio) and a native Anthropic client.

## Installation extras

```bash
pip install 'mmar-carl==0.5.2'           # core
pip install 'mmar-carl[vector-search]'   # FAISS semantic context search
pip install 'mmar-carl[mcp]'             # Model Context Protocol steps
pip install 'mmar-carl[langfuse]'        # Langfuse tracing
pip install 'mmar-carl[pandas]'          # pandas helpers
pip install 'mmar-carl[viz]'             # PNG charts (matplotlib)
pip install 'mmar-carl[e2b]'             # E2B sandbox runtime
pip install 'mmar-carl[codex]'           # Codex step (openai-codex SDK)
pip install 'mmar-carl[skills]'          # AgentSkills catalog + pdf + pptx
pip install 'mmar-carl[all]'             # everything above
```

The OpenAI SDK, `jsonschema` and `httpx` are core dependencies; there is no
`openai` extra. The `mcp` extra pins the MCP SDK to 1.x. Not covered by any
extra: `AnthropicClient` needs `pip install anthropic`, and the Claude Code step
needs the `claude` CLI on `PATH`.

Requires Python 3.12+.

## Where to go next

- [Quick Start](/carl/getting-started/quick-start/): your first chain, runnable offline.
- [Core concepts](/carl/concepts/what-is-carl/): the mental model.
