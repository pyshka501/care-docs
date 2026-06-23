---
title: What is CARL?
description: The format reasoning chains are written in — typed steps, dependencies, and DAG execution — with mmar-carl as its reference library.
sidebar:
  order: 1
---

**CARL** is the format reasoning chains are written in. A chain is a list of typed
**steps** with dependencies, per-step context queries, and execution settings. The
reference implementation of the format is the `mmar-carl` Python library
(Collaborative Agent Reasoning Library): it reads a chain, builds a directed
acyclic graph (DAG), runs everything that can run in parallel, and pulls relevant
context from your input for each step.

In MAESTRO, MAGE writes chains in this format and the runtime executes them.
CARL chains can also be authored and run directly from Python.

## Key features

- **DAG-based execution** — steps parallelise automatically based on dependencies.
- **RAG-like context extraction** — substring or FAISS vector search pulls relevant context per step.
- **Many step types** — LLM, Tool, MCP, Memory, Transform, Conditional, Structured Output, AgentSkill, and multi-agent orchestration (handoff / supervisor / debate / parallel sampling / human-in-the-loop).
- **Async + streaming** — `execute_async` and `stream_async` with per-step callbacks.
- **Evolution & evaluation** — genetic search over chains, metrics, dataset evaluation, reflection.
- **Observability** — execution traces, Gantt charts, token/cost breakdowns, Langfuse.
- **OpenAI-compatible** — OpenRouter, Azure, Ollama, vLLM, LM Studio; plus a native Anthropic client.

## Installation extras

```bash
pip install mmar-carl                 # core (substring search)
pip install 'mmar-carl[vector-search]' # FAISS semantic search
pip install 'mmar-carl[openai]'        # OpenAI-compatible providers
pip install 'mmar-carl[mcp]'           # Model Context Protocol
pip install 'mmar-carl[skills]'        # AgentSkills (+ pdf + pptx)
pip install 'mmar-carl[viz]'           # PNG chart output
pip install 'mmar-carl[all]'           # everything
```

Requires Python 3.12+.

## Where to go next

- [Quick Start](/carl/getting-started/quick-start/) — your first chain.
- [Core concepts](/carl/concepts/what-is-carl/) — the mental model.
