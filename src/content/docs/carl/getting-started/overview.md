---
title: What is CARL?
description: The format reasoning chains are written in — typed steps, dependencies, and DAG execution — with mmar-carl 0.5.0 as its reference library.
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
You can also write and run CARL chains directly from Python.

## What it gives you

- **DAG execution**: steps run in parallel when their dependencies allow.
- **25 step types**: LLM and structured output, tools and MCP, memory and
  transforms, conditionals and loops, bounded agents, delegation to Claude Code
  or Codex, strictly sandboxed code and commands, waits and fan-out, and
  multi-agent orchestration (handoff, supervisor, debate, parallel sampling,
  human input). See [the step list](/carl/steps/overview/).
- **Chains as tools**: embed a tested chain as a typed, isolated tool.
- **Host-owned authority**: a serialized chain only requests; tools, command and
  code policies, network enforcement and human-input providers come from the
  host at run time.
- **Run controls**: fail-fast, acknowledged pause/resume, cancel, timeouts.
- **Async and streaming**: `execute_async`, `stream_async`, per-step callbacks.
- **Evolution and evaluation**: chain mutation and crossover, metrics, dataset
  evaluation, reflection.
- **Observability**: execution traces, token and cost data, Langfuse.
- **Clients**: any OpenAI-compatible API (OpenRouter, Azure, Ollama, vLLM, LM
  Studio) and a native Anthropic client.

## Installation extras

```bash
pip install 'mmar-carl==0.5.0'           # core
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

The OpenAI SDK and `jsonschema` are core dependencies; there is no `openai`
extra. Not covered by any extra: `AnthropicClient` needs `pip install anthropic`,
and the Claude Code step needs the `claude` CLI on `PATH`.

Requires Python 3.12+.

## Where to go next

- [Quick Start](/carl/getting-started/quick-start/): your first chain, runnable offline.
- [Core concepts](/carl/concepts/what-is-carl/): the mental model.
